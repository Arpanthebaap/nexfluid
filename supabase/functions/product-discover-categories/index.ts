import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EXCLUDE_PATTERNS = [
  /\/(cart|checkout|account|login|register|wishlist|compare)/i,
  /\/(privacy|terms|cookie|contact|about|faq|help|sitemap)/i,
  /\?.*(?!page)/,
  /\/#/,
  /\.(pdf|jpg|png|gif|svg|css|js)$/i,
  /\/cdn-cgi\//i,
  /\/index\.php/i,
];

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

// Pagination URLs: ?page=N
function extractPaginationUrls(links: string[], baseUrl: string): string[] {
  const pageUrls: string[] = [];
  for (const link of links) {
    try {
      const u = new URL(link);
      const page = u.searchParams.get('page');
      if (page && parseInt(page) > 1 && link.startsWith(baseUrl.split('?')[0])) {
        pageUrls.push(link);
      }
    } catch { /* skip */ }
  }
  return [...new Set(pageUrls)];
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
    const { categoryUrls } = await req.json();

    if (!categoryUrls?.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'categoryUrls array is required' }),
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

    const allNewProductUrls: string[] = [];
    const results: any[] = [];

    for (const categoryUrl of categoryUrls) {
      try {
        const isRsOnline = categoryUrl.includes('rs-online.com');
        const baseDomain = new URL(categoryUrl).hostname;

        console.log(`--- Discovering: ${categoryUrl} ---`);

        // Step 1: Scrape the parent category page to find subcategory links
        const parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
        console.log(`Found ${parentLinks.length} links on parent page`);

        if (isRsOnline) {
          // RS-Online: directly find product URLs from the category page and paginated pages
          const productUrls = parentLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
          const pageUrls = extractPaginationUrls(parentLinks, categoryUrl);
          console.log(`RS-Online: ${productUrls.length} products, ${pageUrls.length} pagination pages`);

          // Scrape pagination pages
          for (const pageUrl of pageUrls.slice(0, 50)) {
            const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
            const moreProducts = pageLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
            productUrls.push(...moreProducts);
            await new Promise(r => setTimeout(r, 300));
          }

          const unique = [...new Set(productUrls)];
          const newUrls = unique.filter(u => !existingUrls.has(u) && !allNewProductUrls.includes(u));
          allNewProductUrls.push(...newUrls);
          newUrls.forEach(u => existingUrls.add(u));

          results.push({ categoryUrl, subcategories: 0, products: unique.length, new: newUrls.length });
        } else {
          // Valves-direct: find subcategory links, then scrape each for product URLs
          const subcatUrls = parentLinks.filter(l => isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l));
          // Also check for direct product URLs on parent page
          const directProducts = parentLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));

          console.log(`Found ${subcatUrls.length} subcategories, ${directProducts.length} direct products`);

          const allProductUrls = [...directProducts];

          // Step 2: Scrape each subcategory to find product URLs
          for (const subcatUrl of subcatUrls) {
            try {
              console.log(`  Scraping subcategory: ${subcatUrl}`);
              const subcatLinks = await scrapeLinks(subcatUrl, firecrawlKey);

              const products = subcatLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));
              allProductUrls.push(...products);

              // Step 3: Handle pagination
              const pageUrls = extractPaginationUrls(subcatLinks, subcatUrl);
              for (const pageUrl of pageUrls.slice(0, 100)) {
                const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
                const moreProducts = pageLinks.filter(l => isValvesDirectProductUrl(l) && !shouldExclude(l));
                allProductUrls.push(...moreProducts);
                await new Promise(r => setTimeout(r, 300));
              }

              await new Promise(r => setTimeout(r, 300));
            } catch (err) {
              console.error(`Error scraping subcategory ${subcatUrl}:`, err);
            }
          }

          const unique = [...new Set(allProductUrls)];
          const newUrls = unique.filter(u => !existingUrls.has(u) && !allNewProductUrls.includes(u));
          allNewProductUrls.push(...newUrls);
          newUrls.forEach(u => existingUrls.add(u));

          results.push({
            categoryUrl,
            subcategories: subcatUrls.length,
            products: unique.length,
            new: newUrls.length,
          });
        }

        console.log(`Category ${categoryUrl}: ${results[results.length - 1].new} new product URLs`);
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Error processing ${categoryUrl}:`, err);
        results.push({
          categoryUrl,
          subcategories: 0,
          products: 0,
          new: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Bulk insert new URLs as pending scrape jobs
    let inserted = 0;
    if (allNewProductUrls.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < allNewProductUrls.length; i += batchSize) {
        const batch = allNewProductUrls.slice(i, i + batchSize).map(url => ({
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

    return new Response(
      JSON.stringify({
        success: true,
        totalNew: inserted,
        totalProducts: allNewProductUrls.length,
        results,
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
