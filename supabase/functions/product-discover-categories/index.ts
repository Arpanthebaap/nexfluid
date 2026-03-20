import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// URL patterns that indicate product pages (not category/navigation pages)
const PRODUCT_URL_PATTERNS: Record<string, RegExp[]> = {
  'valves-direct.com': [
    /\/\d+-[a-z].*\.html$/i,
    /\/[a-z].*-\d+\.html$/i,
    /\.html$/i,
  ],
  'rs-online.com': [
    /\/product\//i,
    /\/p\//i,
    /\/productDetail/i,
  ],
};

// URL patterns to exclude (navigation, categories, etc.)
const EXCLUDE_PATTERNS = [
  /\/(cart|checkout|account|login|register|wishlist|compare)/i,
  /\/(privacy|terms|cookie|contact|about|faq|help|sitemap)/i,
  /\/#/,
  /\?.*page=/i,
  /\.(pdf|jpg|png|gif|svg|css|js)$/i,
  /\/cdn-cgi\//i,
];

function isProductUrl(url: string, domain: string): boolean {
  // Exclude non-product pages
  if (EXCLUDE_PATTERNS.some(p => p.test(url))) return false;

  // For valves-direct: product pages end in .html and have a numeric prefix pattern
  if (domain.includes('valves-direct')) {
    const path = new URL(url).pathname;
    // Category pages: /3-air-preparation-equipment (just number-name)
    // Product pages: /123-some-product-name.html (number-name.html)
    // Also filter out the top-level category pages we started from
    if (!path.endsWith('.html')) return false;
    // Must have at least 2 path segments or a numeric ID pattern
    return /\/\d+[-_]/.test(path);
  }

  // For RS-Online: product pages contain /product/ or specific patterns
  if (domain.includes('rs-online')) {
    const patterns = PRODUCT_URL_PATTERNS['rs-online.com'];
    return patterns.some(p => p.test(url));
  }

  // Default: accept URLs with numeric IDs in path
  return /\/\d{3,}/.test(url);
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

    const results: { category: string; mapped: number; filtered: number; new: number; error?: string }[] = [];
    const allNewUrls: string[] = [];

    for (const categoryUrl of categoryUrls) {
      try {
        console.log(`Mapping category: ${categoryUrl}`);
        const domain = new URL(categoryUrl).hostname;

        const response = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: categoryUrl,
            limit: 5000,
            includeSubdomains: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Map failed for ${categoryUrl}:`, data);
          results.push({ category: categoryUrl, mapped: 0, filtered: 0, new: 0, error: data.error || `HTTP ${response.status}` });
          continue;
        }

        const links: string[] = data.links || data.data?.links || [];
        console.log(`Found ${links.length} URLs for ${categoryUrl}`);

        // Filter to product URLs only
        const productUrls = links.filter(url => isProductUrl(url, domain));
        console.log(`Filtered to ${productUrls.length} product URLs`);

        // Deduplicate against existing jobs and already-found URLs
        const newUrls = productUrls.filter(url => !existingUrls.has(url) && !allNewUrls.includes(url));

        results.push({
          category: categoryUrl,
          mapped: links.length,
          filtered: productUrls.length,
          new: newUrls.length,
        });

        allNewUrls.push(...newUrls);
        newUrls.forEach(url => existingUrls.add(url));

        // Small delay between map calls
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Error mapping ${categoryUrl}:`, err);
        results.push({
          category: categoryUrl,
          mapped: 0, filtered: 0, new: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Bulk insert new URLs as pending scrape jobs
    let inserted = 0;
    if (allNewUrls.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < allNewUrls.length; i += batchSize) {
        const batch = allNewUrls.slice(i, i + batchSize).map(url => ({
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
        totalMapped: results.reduce((s, r) => s + r.mapped, 0),
        totalFiltered: results.reduce((s, r) => s + r.filtered, 0),
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
