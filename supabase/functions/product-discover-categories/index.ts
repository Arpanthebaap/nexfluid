import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EXCLUDE_PATTERNS = [
  /\/(cart|checkout|account|login|register|wishlist|compare)/i,
  /\/(privacy|terms|cookie|contact|about|faq|help|sitemap)/i,
  /\/#/,
  /\.(pdf|jpg|png|gif|svg|css|js)$/i,
  /\/cdn-cgi\//i,
  /\/index\.php/i,
];

function shouldExclude(url: string): boolean {
  return EXCLUDE_PATTERNS.some(p => p.test(url));
}

function isValvesDirectProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    if (!path.endsWith('.html')) return false;
    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) return false;
    const lastSeg = segments[segments.length - 1];
    return /^\d+[-]/.test(lastSeg);
  } catch { return false; }
}

function isValvesDirectSubcategoryUrl(url: string, baseDomain: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== baseDomain) return false;
    const path = parsed.pathname;
    if (path.endsWith('.html')) return false;
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return false;
    // Check first segment matches \d+- pattern (category/subcategory)
    return /^\d+-/.test(segments[0]);
  } catch { return false; }
}

function isRsOnlineProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return /\/web\/p\//.test(path);
  } catch { return false; }
}

function extractPaginationUrls(links: string[], baseUrl: string): string[] {
  const baseWithoutParams = baseUrl.split('?')[0];
  const pageUrls: string[] = [];
  for (const link of links) {
    try {
      const u = new URL(link);
      const page = u.searchParams.get('page') || u.searchParams.get('p');
      if (page && parseInt(page) > 1 && link.startsWith(baseWithoutParams)) {
        pageUrls.push(link);
      }
    } catch { /* skip */ }
  }
  return [...new Set(pageUrls)].sort((a, b) => {
    const pa = parseInt(new URL(a).searchParams.get('page') || new URL(a).searchParams.get('p') || '0');
    const pb = parseInt(new URL(b).searchParams.get('page') || new URL(b).searchParams.get('p') || '0');
    return pa - pb;
  });
}

async function scrapeLinks(url: string, firecrawlKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['links'],
        onlyMainContent: false,
        timeout: 45000,
      }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`Non-JSON response for ${url}: ${text.substring(0, 200)}`);
      return [];
    }

    if (!response.ok) {
      console.error(`Scrape failed for ${url}:`, data);
      return [];
    }

    return data.data?.links || data.links || [];
  } catch (err) {
    console.error(`Network error scraping ${url}:`, err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Per-request timing (NOT module-level) so each invocation gets a fresh 50s window
  const startTime = Date.now();
  const SAFETY_LIMIT_MS = 50000;
  function isTimeSafe(): boolean {
    return (Date.now() - startTime) < SAFETY_LIMIT_MS;
  }

  try {
    const { categoryUrl } = await req.json();

    if (!categoryUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'categoryUrl is required (single URL)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isRsOnline = categoryUrl.includes('rs-online.com');
    const baseDomain = new URL(categoryUrl).hostname;

    console.log(`--- Discovering: ${categoryUrl} ---`);

    let parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
    // Retry once if parent page returned 0 links (likely blocked/timeout)
    if (parentLinks.length === 0 && isTimeSafe()) {
      console.log(`Parent page returned 0 links, retrying after 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
    }
    console.log(`Found ${parentLinks.length} links on parent page`);

    const allProductUrls: string[] = [];
    let subcategoriesScraped = 0;
    let pagesScraped = 0;
    let timedOut = false;

    if (isRsOnline) {
      const productUrls = parentLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
      allProductUrls.push(...productUrls);

      const pageUrls = extractPaginationUrls(parentLinks, categoryUrl);
      console.log(`RS-Online: ${productUrls.length} products, ${pageUrls.length} pagination pages`);

      for (const pageUrl of pageUrls) {
        if (!isTimeSafe()) { timedOut = true; break; }
        const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
        const moreProducts = pageLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
        allProductUrls.push(...moreProducts);
        pagesScraped++;
        await new Promise(r => setTimeout(r, 200));
      }
    } else {
      const subcatUrls = parentLinks.filter(l => isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l));
      const directProducts = parentLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));
      allProductUrls.push(...directProducts);

      console.log(`Found ${subcatUrls.length} subcategories, ${directProducts.length} direct products`);

      for (const subcatUrl of subcatUrls) {
        if (!isTimeSafe()) { timedOut = true; break; }
        try {
          console.log(`  Scraping subcategory: ${subcatUrl}`);
          const subcatLinks = await scrapeLinks(subcatUrl, firecrawlKey);
          subcategoriesScraped++;

          const products = subcatLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));
          allProductUrls.push(...products);

          const pageUrls = extractPaginationUrls(subcatLinks, subcatUrl);
          for (const pageUrl of pageUrls) {
            if (!isTimeSafe()) { timedOut = true; break; }
            const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
            const moreProducts = pageLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));
            allProductUrls.push(...moreProducts);
            pagesScraped++;
            await new Promise(r => setTimeout(r, 200));
          }

          if (timedOut) break;
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          console.error(`Error scraping subcategory ${subcatUrl}:`, err);
        }
      }
    }

    // Deduplicate discovered URLs
    const unique = [...new Set(allProductUrls)];

    // Upsert into scrape_jobs — ON CONFLICT DO NOTHING (unique index on source_url)
    let inserted = 0;
    let requeued = 0;
    if (unique.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < unique.length; i += batchSize) {
        const batch = unique.slice(i, i + batchSize).map(url => ({
          source_url: url,
          status: 'pending' as const,
        }));
        const { data, error } = await supabase
          .from('scrape_jobs')
          .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true })
          .select('id');
        if (error) {
          console.error('Upsert error:', error);
        } else {
          // data contains only actually inserted rows (ignoreDuplicates skips existing)
          inserted += (data?.length || 0);
        }
      }

      // Re-queue failed URLs back to pending — use small batches (50) to avoid PostgREST URL size limit
      const requeueBatch = 50;
      for (let i = 0; i < unique.length; i += requeueBatch) {
        const batch = unique.slice(i, i + requeueBatch);
        const { data, error } = await supabase
          .from('scrape_jobs')
          .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() })
          .in('source_url', batch)
          .eq('status', 'failed')
          .select('id');
        if (error) {
          console.error('Requeue error:', error);
        } else {
          requeued += (data?.length || 0);
        }
      }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`Done in ${elapsed}s: ${unique.length} found, ${inserted} new, ${requeued} requeued from failed`);

    return new Response(
      JSON.stringify({
        success: true,
        categoryUrl,
        totalFound: unique.length,
        totalNew: inserted,
        totalRequeued: requeued,
        subcategoriesScraped,
        pagesScraped,
        timedOut,
        elapsedSeconds: elapsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discovery error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
