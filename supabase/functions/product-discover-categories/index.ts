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

const START_TIME = Date.now();
const SAFETY_LIMIT_MS = 50000; // 50s safety window (edge fn has 60s limit)

function isTimeSafe(): boolean {
  return (Date.now() - START_TIME) < SAFETY_LIMIT_MS;
}

function shouldExclude(url: string): boolean {
  return EXCLUDE_PATTERNS.some(p => p.test(url));
}

// Valves-direct product URLs: /{series-slug}/{id}-{name}.html
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

// Valves-direct subcategory URLs: /{number}-{slug}
function isValvesDirectSubcategoryUrl(url: string, baseDomain: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== baseDomain) return false;
    const path = parsed.pathname;
    if (path.endsWith('.html')) return false;
    const segments = path.split('/').filter(Boolean);
    if (segments.length !== 1) return false;
    return /^\d+-/.test(segments[0]);
  } catch { return false; }
}

// RS-Online product URLs: /web/p/{product-slug}/{id}/
function isRsOnlineProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return /\/web\/p\//.test(path);
  } catch { return false; }
}

// Pagination URLs: ?page=N or p=N
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

  const data = await response.json();
  if (!response.ok) {
    console.error(`Scrape failed for ${url}:`, data);
    return [];
  }

  return data.data?.links || data.links || [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Get existing URLs to deduplicate
    const { data: existingJobs } = await supabase
      .from('scrape_jobs')
      .select('source_url');
    const existingUrls = new Set((existingJobs || []).map((j: any) => j.source_url));

    const isRsOnline = categoryUrl.includes('rs-online.com');
    const baseDomain = new URL(categoryUrl).hostname;

    console.log(`--- Discovering: ${categoryUrl} ---`);

    // Step 1: Scrape the parent category page
    const parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
    console.log(`Found ${parentLinks.length} links on parent page`);

    const allProductUrls: string[] = [];
    let subcategoriesScraped = 0;
    let pagesScraped = 0;
    let timedOut = false;

    if (isRsOnline) {
      // RS-Online: find product URLs directly + pagination
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
      // Valves-direct: find subcategories, then product URLs from each
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

          // Handle pagination within this subcategory
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

    // Deduplicate
    const unique = [...new Set(allProductUrls)];
    const newUrls = unique.filter(u => !existingUrls.has(u));

    // Insert new URLs as pending scrape jobs
    let inserted = 0;
    if (newUrls.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < newUrls.length; i += batchSize) {
        const batch = newUrls.slice(i, i + batchSize).map(url => ({
          source_url: url,
          status: 'pending' as const,
        }));
        const { error } = await supabase.from('scrape_jobs').insert(batch);
        if (error) {
          console.error('Insert error:', error);
        } else {
          inserted += batch.length;
        }
      }
    }

    const elapsed = Math.round((Date.now() - START_TIME) / 1000);
    console.log(`Done in ${elapsed}s: ${inserted} new of ${unique.length} total products found`);

    return new Response(
      JSON.stringify({
        success: true,
        categoryUrl,
        totalFound: unique.length,
        totalNew: inserted,
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
