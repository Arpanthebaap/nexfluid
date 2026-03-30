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
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'urls array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean and validate URLs
    const validUrls = urls
      .map((u: string) => u.trim())
      .filter((u: string) => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')));

    if (validUrls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid URLs provided. URLs must start with http:// or https://' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const unique = [...new Set(validUrls)];
    let inserted = 0;
    let requeued = 0;
    const batchSize = 50;

    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize).map((url: string) => ({
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

    // Re-queue failed URLs
    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
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

    return new Response(
      JSON.stringify({
        success: true,
        totalSubmitted: unique.length,
        totalNew: inserted,
        totalRequeued: requeued,
        totalSkipped: unique.length - inserted - requeued,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Add URLs error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
