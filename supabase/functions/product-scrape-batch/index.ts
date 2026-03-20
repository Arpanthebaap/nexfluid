import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobIds, batchSize = 5 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending jobs - either specific IDs or next batch
    let query = supabase.from('scrape_jobs').select('*').eq('status', 'pending').limit(batchSize);
    if (jobIds?.length) {
      query = supabase.from('scrape_jobs').select('*').in('id', jobIds).eq('status', 'pending');
    }
    const { data: jobs, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobs?.length) {
      return new Response(
        JSON.stringify({ success: true, scraped: 0, message: 'No pending jobs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productSchema = {
      type: "object",
      properties: {
        product_name: { type: "string" },
        product_code: { type: "string" },
        brand: { type: "string" },
        description: { type: "string" },
        images: { type: "array", items: { type: "string" } },
        specifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              value: { type: "string" },
              unit: { type: "string" }
            },
            required: ["name", "value"]
          }
        },
        category_hint: { type: "string" }
      },
      required: ["product_name"]
    };

    let scraped = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        console.log(`Scraping: ${job.source_url}`);

        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: job.source_url,
            formats: ['markdown', 'links'],
            jsonOptions: {
              schema: productSchema,
              prompt: 'Extract the product information from this page. Get the product name, code/SKU, brand, description, image URLs, and technical specifications.',
            },
            onlyMainContent: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Scrape failed for ${job.source_url}:`, data);
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: data.error || `HTTP ${response.status}`,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        const rawData = {
          markdown: data.data?.markdown || data.markdown,
          json: data.data?.json || data.json,
          links: data.data?.links || data.links,
          metadata: data.data?.metadata || data.metadata,
        };

        await supabase.from('scrape_jobs').update({
          status: 'scraped',
          raw_data: rawData,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);

        scraped++;

        // Small delay between scrapes to be respectful
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error scraping ${job.source_url}:`, err);
        await supabase.from('scrape_jobs').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, scraped, failed, total: jobs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
