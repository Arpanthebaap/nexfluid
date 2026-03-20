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
    const { batchSize = 5 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get scraped jobs ready for AI processing
    const { data: jobs, error: fetchError } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('status', 'scraped')
      .limit(batchSize);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobs?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No scraped jobs to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch categories for matching
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name_en, name_it, slug, parent_id')
      .eq('is_active', true);

    const categoryList = (categories || [])
      .map(c => `${c.name_en} (${c.slug}, id:${c.id})`)
      .join('\n');

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const rawJson = job.raw_data?.json || {};
        const rawMarkdown = job.raw_data?.markdown || '';
        const productName = rawJson.product_name || 'Unknown Product';
        const originalDesc = rawJson.description || rawMarkdown.slice(0, 2000);
        const brand = rawJson.brand || '';
        const specs = rawJson.specifications || [];
        const categoryHint = rawJson.category_hint || '';

        const prompt = `You are a product content specialist for an industrial equipment catalog. Process the following product data and return structured output.

PRODUCT DATA:
- Name: ${productName}
- Brand: ${brand}
- Category hint: ${categoryHint}
- Original description: ${originalDesc}
- Specs: ${JSON.stringify(specs)}

AVAILABLE CATEGORIES:
${categoryList}

TASKS:
1. Rewrite the product description in English — must be 100% original, professional, SEO-friendly. Do NOT copy any text from the original.
2. Translate the rewritten description to Italian.
3. Generate an SEO meta title (max 60 chars) in both English and Italian.
4. Generate an SEO meta description (max 160 chars) in both English and Italian.
5. Match this product to the BEST category from the list above. Return the category ID.
6. Generate a clean product code/SKU if not available.`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a product content specialist. Return structured data via the provided tool.' },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'save_product',
                description: 'Save processed product data',
                parameters: {
                  type: 'object',
                  properties: {
                    name_en: { type: 'string', description: 'Product name in English' },
                    name_it: { type: 'string', description: 'Product name in Italian' },
                    description_en: { type: 'string', description: 'Rewritten description in English' },
                    description_it: { type: 'string', description: 'Translated description in Italian' },
                    meta_title_en: { type: 'string', description: 'SEO title English (max 60 chars)' },
                    meta_title_it: { type: 'string', description: 'SEO title Italian (max 60 chars)' },
                    meta_description_en: { type: 'string', description: 'SEO meta desc English (max 160 chars)' },
                    meta_description_it: { type: 'string', description: 'SEO meta desc Italian (max 160 chars)' },
                    category_id: { type: 'string', description: 'Best matching category UUID' },
                    product_code: { type: 'string', description: 'Product code/SKU' },
                    brand: { type: 'string', description: 'Brand name' },
                  },
                  required: ['name_en', 'name_it', 'description_en', 'description_it', 'meta_title_en', 'meta_title_it', 'meta_description_en', 'meta_description_it'],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'save_product' } }
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI error for job ${job.id}:`, response.status, errText);
          
          if (response.status === 429) {
            // Rate limited — stop processing this batch, let frontend retry
            return new Response(
              JSON.stringify({ success: true, processed, failed, rateLimited: true, message: 'Rate limited — retry in a moment' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ success: false, error: 'AI credits exhausted. Add funds at Settings > Workspace > Usage.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: `AI error: ${response.status}`,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        const aiData = await response.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall) {
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: 'AI did not return structured data',
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        const processedData = JSON.parse(toolCall.function.arguments);

        // Merge with raw data
        processedData.images = rawJson.images || [];
        processedData.specifications = specs;
        processedData.source_url = job.source_url;
        processedData.description_original = originalDesc;
        if (!processedData.brand && brand) processedData.brand = brand;
        if (!processedData.product_code) processedData.product_code = rawJson.product_code || '';

        await supabase.from('scrape_jobs').update({
          status: 'processed',
          processed_data: processedData,
          category_id: processedData.category_id || null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);

        processed++;

        // Delay between AI calls
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error(`Error processing job ${job.id}:`, err);
        await supabase.from('scrape_jobs').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, total: jobs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI process error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
