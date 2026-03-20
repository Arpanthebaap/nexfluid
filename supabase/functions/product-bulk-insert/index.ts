import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchSize = 10 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get processed jobs ready for import
    const { data: jobs, error: fetchError } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('status', 'processed')
      .limit(batchSize);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobs?.length) {
      return new Response(
        JSON.stringify({ success: true, imported: 0, message: 'No processed jobs to import' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imported = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const pd = job.processed_data;
        if (!pd?.name_en || !pd?.product_code) {
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: 'Missing required fields (name_en or product_code)',
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        // Category verification: if no category_id or it's invalid, try URL-based matching
        let categoryId = job.category_id || pd.category_id || null;
        if (!categoryId && job.source_url) {
          try {
            const urlPath = new URL(job.source_url).pathname;
            const segments = urlPath.split('/').filter(Boolean);
            if (segments.length >= 2) {
              const slug = segments[segments.length - 2];
              const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', slug)
                .single();
              if (cat) categoryId = cat.id;
            }
          } catch {}
        }

        const baseSlug = slugify(pd.name_en);
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        // Insert product
        const { data: product, error: insertError } = await supabase
          .from('products')
          .insert({
            name_en: pd.name_en,
            name_it: pd.name_it || pd.name_en,
            slug: uniqueSlug,
            product_code: pd.product_code,
            brand: pd.brand || null,
            category_id: categoryId,
            description_en: pd.description_en || null,
            description_it: pd.description_it || null,
            description_original: pd.description_original || null,
            meta_title_en: pd.meta_title_en || null,
            meta_title_it: pd.meta_title_it || null,
            meta_description_en: pd.meta_description_en || null,
            meta_description_it: pd.meta_description_it || null,
            images: pd.images || [],
            source_url: pd.source_url || job.source_url,
            status: 'published',
            is_active: true,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`Insert error for job ${job.id}:`, insertError);
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: `Insert failed: ${insertError.message}`,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        // Insert product attributes/specs
        if (pd.specifications?.length && product?.id) {
          const attrs = pd.specifications.map((s: any) => ({
            product_id: product.id,
            attribute_name: s.name,
            attribute_value: s.value,
            attribute_unit: s.unit || null,
          }));

          const { error: attrError } = await supabase
            .from('product_attributes')
            .insert(attrs);

          if (attrError) {
            console.error(`Attribute insert error for product ${product.id}:`, attrError);
          }
        }

        // Mark job as imported
        await supabase.from('scrape_jobs').update({
          status: 'imported',
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);

        imported++;
      } catch (err) {
        console.error(`Error importing job ${job.id}:`, err);
        await supabase.from('scrape_jobs').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, imported, failed, total: jobs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk insert error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
