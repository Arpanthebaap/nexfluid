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
    // Reject query-string filter URLs (brand filters, accessory filters etc.)
    if (parsed.search) return false;
    // Reject fragment URLs
    if (parsed.hash) return false;
    const path = parsed.pathname;
    if (path.endsWith('.html')) return false;
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return false;
    return /^\d+-/.test(segments[0]);
  } catch { return false; }
}

function isRsOnlineProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return /\/web\/p\//.test(path);
  } catch { return false; }
}

// --- Map API based discovery (primary, fast) ---

async function mapUrls(url: string, firecrawlKey: string, limit = 5000): Promise<string[]> {
  try {
    console.log(`  MAP: ${url} (limit=${limit})`);
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, limit, includeSubdomains: false }),
    });

    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      console.error(`Map returned non-JSON: ${text.substring(0, 200)}`);
      return [];
    }

    if (!response.ok) {
      console.error(`Map API error (${response.status}):`, data);
      return [];
    }

    const links = data.links || data.data?.links || [];
    console.log(`  MAP returned ${links.length} URLs`);
    return links;
  } catch (err) {
    console.error(`Map network error for ${url}:`, err);
    return [];
  }
}

// --- Scrape-based discovery (fallback) ---

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
    try { data = JSON.parse(text); } catch {
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

  const startTime = Date.now();
  const SAFETY_LIMIT_MS = 120000;
  function isTimeSafe(): boolean {
    return (Date.now() - startTime) < SAFETY_LIMIT_MS;
  }

  try {
    const { categoryUrl } = await req.json();

    if (!categoryUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'categoryUrl is required' }),
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

    const allProductUrls: string[] = [];
    let mapCalls = 0;
    let scrapeFallback = false;
    let timedOut = false;

    // === PRIMARY: Map API based discovery ===
    const mapLinks = await mapUrls(categoryUrl, firecrawlKey);
    mapCalls++;

    const productFilter = isRsOnline ? isRsOnlineProductUrl : isValvesDirectProductUrl;

    if (mapLinks.length > 0) {
      const products = mapLinks.filter(l => productFilter(l) && !shouldExclude(l));
      const subcatUrls = !isRsOnline
        ? mapLinks.filter(l => isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l)).filter(l => l !== categoryUrl)
        : [];

      if (products.length === 0 && subcatUrls.length === 0) {
        // Map returned generic links but no products/subcats — fall back to scrape
        console.log(`Map returned ${mapLinks.length} links but 0 products/subcats, falling back to scrape`);
        scrapeFallback = true;
      } else {
        allProductUrls.push(...products);

        if (!isRsOnline) {
          const seenPaths = new Set<string>();
          const uniqueSubcats = subcatUrls.filter(u => {
            const p = new URL(u).pathname;
            if (seenPaths.has(p)) return false;
            seenPaths.add(p);
            return true;
          });

          console.log(`Map found ${products.length} products, ${uniqueSubcats.length} unique subcategories`);

          for (const subcatUrl of uniqueSubcats) {
            if (!isTimeSafe()) { timedOut = true; break; }
            const subcatLinks = await mapUrls(subcatUrl, firecrawlKey);
            mapCalls++;
            const moreProducts = subcatLinks.filter(l => productFilter(l) && !shouldExclude(l));
            allProductUrls.push(...moreProducts);
            await new Promise(r => setTimeout(r, 100));
          }
        } else {
          console.log(`Map found ${products.length} RS-Online products`);
        }
      }
    } else {
      console.log('Map returned 0 links, falling back to scrape');
      scrapeFallback = true;
    }

    // === SCRAPE FALLBACK ===
    if (scrapeFallback) {
      let parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
      if (parentLinks.length === 0 && isTimeSafe()) {
        console.log('Parent page returned 0 links, retrying after 2s...');
        await new Promise(r => setTimeout(r, 2000));
        parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
      }
      console.log(`Fallback: Found ${parentLinks.length} links on parent page`);

      if (isRsOnline) {
        const productUrls = parentLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
        allProductUrls.push(...productUrls);
      } else {
        const subcatUrls = parentLinks.filter(l => isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l));
        const directProducts = parentLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));
        allProductUrls.push(...directProducts);

        const sameDomainLinks = parentLinks.filter(l => { try { return new URL(l).hostname === baseDomain; } catch { return false; } });
        console.log(`Fallback: ${subcatUrls.length} subcats, ${directProducts.length} products (${sameDomainLinks.length} same-domain)`);

        for (const subcatUrl of subcatUrls) {
          if (!isTimeSafe()) { timedOut = true; break; }
          const subcatLinks = await scrapeLinks(subcatUrl, firecrawlKey);
          const products = subcatLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));
          allProductUrls.push(...products);
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }

    // Deduplicate
    const unique = [...new Set(allProductUrls)];
    console.log(`Total unique product URLs: ${unique.length} (${mapCalls} map calls, fallback=${scrapeFallback})`);

    // Upsert into scrape_jobs
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
          inserted += (data?.length || 0);
        }
      }

      // Re-queue failed URLs back to pending (small batches to avoid PostgREST URL limit)
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
    console.log(`Done in ${elapsed}s: ${unique.length} found, ${inserted} new, ${requeued} requeued`);

    return new Response(
      JSON.stringify({
        success: true,
        categoryUrl,
        totalFound: unique.length,
        totalNew: inserted,
        totalRequeued: requeued,
        mapCalls,
        scrapeFallback,
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
