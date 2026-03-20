import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Product URLs end in .html and have pattern /{category-slug}/{id}-{name}.html
function isProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    // Must end in .html
    if (!path.endsWith('.html')) return false;
    // Must have at least 2 path segments (category/product)
    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) return false;
    // Product segment starts with a number
    const productSegment = segments[segments.length - 1];
    return /^\d+[-]/.test(productSegment);
  } catch {
    return false;
  }
}

// Exclude non-product pages
const EXCLUDE_PATTERNS = [
  /\/(cart|checkout|account|login|register|wishlist|compare)/i,
  /\/(privacy|terms|cookie|contact|about|faq|help|sitemap)/i,
  /\?/,
  /\/#/,
  /\.(pdf|jpg|png|gif|svg|css|js)$/i,
  /\/cdn-cgi\//i,
  /\/index\.php/i,
];

function shouldExclude(url: string): boolean {
  return EXCLUDE_PATTERNS.some(p => p.test(url));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domains } = await req.json();

    // Default domains to scrape
    const targetDomains = domains || [
      'https://www.valves-direct.com',
    ];

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

    const results: { domain: string; mapped: number; products: number; new: number; error?: string }[] = [];
    const allNewUrls: string[] = [];

    for (const domainUrl of targetDomains) {
      try {
        console.log(`Mapping domain: ${domainUrl}`);

        const response = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: domainUrl,
            limit: 5000,
            includeSubdomains: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Map failed for ${domainUrl}:`, data);
          results.push({ domain: domainUrl, mapped: 0, products: 0, new: 0, error: data.error || `HTTP ${response.status}` });
          continue;
        }

        const links: string[] = data.links || data.data?.links || [];
        console.log(`Found ${links.length} total URLs for ${domainUrl}`);

        // Filter to product URLs only
        const productUrls = links.filter(url => !shouldExclude(url) && isProductUrl(url));
        console.log(`Filtered to ${productUrls.length} product URLs`);

        // Deduplicate
        const newUrls = productUrls.filter(url => !existingUrls.has(url) && !allNewUrls.includes(url));

        results.push({
          domain: domainUrl,
          mapped: links.length,
          products: productUrls.length,
          new: newUrls.length,
        });

        allNewUrls.push(...newUrls);
        newUrls.forEach(url => existingUrls.add(url));

        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Error mapping ${domainUrl}:`, err);
        results.push({
          domain: domainUrl,
          mapped: 0, products: 0, new: 0,
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
        totalProducts: results.reduce((s, r) => s + r.products, 0),
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
