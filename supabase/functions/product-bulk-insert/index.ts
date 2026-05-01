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

        // Category verification with enhanced URL-based fallback
        let categoryId = job.category_id || pd.category_id || null;
        if (!categoryId && job.source_url) {
          try {
            const urlPath = new URL(job.source_url).pathname;
            const segments = urlPath.split('/').filter(Boolean);
            const isRsOnline = /rs-online\.com/i.test(job.source_url);
            // Try multiple slug strategies (in priority order)
            const slugsToTry: string[] = [];
            if (isRsOnline && segments.length >= 3) {
              // rs-online: /web/p/<category-slug>/<product-id>
              slugsToTry.push(segments[2].replace(/^\d+-/, ''));
            }
            if (segments.length >= 2) {
              const parentSlug = segments[segments.length - 2];
              slugsToTry.push(parentSlug);
              slugsToTry.push(parentSlug.replace(/^\d+-/, ''));
            }
            if (segments.length >= 1) {
              slugsToTry.push(segments[0].replace(/^\d+-/, ''));
            }
            for (const slug of slugsToTry) {
              if (!slug) continue;
              const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();
              if (cat) { categoryId = cat.id; break; }
            }
            // Auto-create category if still none matched (prevents uncategorized products)
            if (!categoryId) {
              const primarySlug = (isRsOnline && segments.length >= 3
                ? segments[2]
                : segments[0] || ''
              ).replace(/^\d+-/, '');
              if (primarySlug) {
                const humanName = primarySlug
                  .split('-')
                  .map((w) => w ? w.charAt(0).toUpperCase() + w.slice(1) : w)
                  .join(' ');
                const { data: newCat } = await supabase
                  .from('categories')
                  .insert({
                    slug: primarySlug,
                    name_en: humanName,
                    name_it: humanName,
                    parent_id: null,
                    is_active: true,
                    sort_order: 0,
                  })
                  .select('id')
                  .single();
                if (newCat) categoryId = newCat.id;
              }
            }
          } catch (e) {
            console.error('Category resolution error:', e);
          }
        }

        const baseSlug = slugify(pd.name_en);
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        // Check if product with same product_code already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id, slug')
          .eq('product_code', pd.product_code)
          .maybeSingle();

        if (existing) {
          // UPDATE existing product (idempotent)
          const { error: updateError } = await supabase
            .from('products')
            .update({
              name_en: pd.name_en,
              name_it: pd.name_it || pd.name_en,
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
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Update error for job ${job.id}:`, updateError);
            await supabase.from('scrape_jobs').update({
              status: 'failed',
              error_message: `Update failed: ${updateError.message}`,
              updated_at: new Date().toISOString(),
            }).eq('id', job.id);
            failed++;
            continue;
          }

          // Replace attributes for existing product
          if (pd.specifications?.length) {
            await supabase.from('product_attributes').delete().eq('product_id', existing.id);
            const attrs = pd.specifications.map((s: any) => ({
              product_id: existing.id,
              attribute_name: s.name,
              attribute_value: s.value,
              attribute_unit: s.unit || null,
            }));
            await supabase.from('product_attributes').insert(attrs);
          }

          await supabase.from('scrape_jobs').update({
            status: 'imported',
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);

          imported++;
        } else {
          // INSERT new product
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

          await supabase.from('scrape_jobs').update({
            status: 'imported',
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);

          imported++;
        }
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
