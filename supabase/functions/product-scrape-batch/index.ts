import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function scrapeWithRetry(url: string, firecrawlKey: string): Promise<{ ok: boolean; data: any }> {
  // First attempt with 60s timeout
  const attempt = async (timeout: number) => {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        timeout,
      }),
    });
    return { response, data: await response.json() };
  };

  // First try: 60s
  let result = await attempt(60000);
  if (result.response.ok) {
    return { ok: true, data: result.data };
  }

  // If timeout, retry with 90s
  if (result.data?.code === 'SCRAPE_TIMEOUT') {
    console.log(`Retrying ${url} with 90s timeout...`);
    result = await attempt(90000);
    if (result.response.ok) {
      return { ok: true, data: result.data };
    }
  }

  return { ok: false, data: result.data };
}

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

    // Get pending jobs
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

    let scraped = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        console.log(`Scraping: ${job.source_url}`);

        const result = await scrapeWithRetry(job.source_url, firecrawlKey);

        if (!result.ok) {
          console.error(`Scrape failed for ${job.source_url}:`, result.data);
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: result.data.error || result.data.code || `Scrape failed`,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        const rawData = {
          markdown: result.data.data?.markdown || result.data.markdown,
          links: result.data.data?.links || result.data.links,
          metadata: result.data.data?.metadata || result.data.metadata,
        };

        await supabase.from('scrape_jobs').update({
          status: 'scraped',
          raw_data: rawData,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);

        scraped++;
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
