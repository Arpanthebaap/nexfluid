import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractImageUrls(html: string, baseUrl: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    
    // Skip tiny icons, tracking pixels, logos, svgs
    if (src.includes('data:') || src.includes('.svg') || src.includes('logo') ||
        src.includes('icon') || src.includes('favicon') || src.includes('pixel') ||
        src.includes('tracking') || src.includes('banner') || src.includes('flag') ||
        src.includes('social') || src.includes('badge') || src.includes('cart') ||
        src.includes('avatar') || src.includes('placeholder') ||
        src.length < 10) continue;
    
    // Check for size indicators suggesting product images (not thumbnails)
    const widthMatch = match[0].match(/width=["']?(\d+)/i);
    const heightMatch = match[0].match(/height=["']?(\d+)/i);
    if (widthMatch && parseInt(widthMatch[1]) < 50) continue;
    if (heightMatch && parseInt(heightMatch[1]) < 50) continue;

    // Make absolute URL
    if (src.startsWith('//')) src = 'https:' + src;
    else if (src.startsWith('/')) {
      try { src = new URL(src, baseUrl).href; } catch { continue; }
    } else if (!src.startsWith('http')) {
      try { src = new URL(src, baseUrl).href; } catch { continue; }
    }
    
    // Only keep image file types
    if (src.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
      urls.push(src);
    }
  }
  
  // Deduplicate
  return [...new Set(urls)];
}

async function downloadAndUpload(
  imageUrl: string,
  productId: string,
  index: number,
  supabase: any
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    
    if (!response.ok) return null;
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    // Skip very small images (likely icons)
    if (buffer.byteLength < 5000) return null;
    
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filePath = `${productId}/${index}.${ext}`;
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      console.error(`Upload error for ${filePath}:`, error.message);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error(`Download error for ${imageUrl}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchSize = 5 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find products with source_url but no images
    const { data: products, error: fetchErr } = await supabase
      .from('products')
      .select('id, source_url, images, product_code')
      .not('source_url', 'is', null)
      .eq('is_active', true)
      .or('images.is.null,images.eq.[]')
      .limit(batchSize);

    if (fetchErr) {
      return new Response(
        JSON.stringify({ success: false, error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!products?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No products need images' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const product of products) {
      try {
        let imageUrls: string[] = [];

        // First try: check if scrape_jobs has raw_data with image URLs already
        const { data: job } = await supabase
          .from('scrape_jobs')
          .select('raw_data')
          .eq('source_url', product.source_url)
          .eq('status', 'imported')
          .single();

        if (job?.raw_data?.markdown) {
          // Extract image URLs from markdown
          const mdImgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp|gif))/gi;
          let match;
          while ((match = mdImgRegex.exec(job.raw_data.markdown)) !== null) {
            imageUrls.push(match[1]);
          }
        }

        // If no images found from existing data, scrape with Firecrawl
        if (imageUrls.length === 0 && firecrawlKey) {
          console.log(`Scraping images for ${product.product_code}: ${product.source_url}`);
          
          const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: product.source_url,
              formats: ['html'],
              onlyMainContent: true,
            }),
          });

          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            const html = scrapeData.data?.html || scrapeData.html || '';
            imageUrls = extractImageUrls(html, product.source_url);
          }
          
          // Rate limit courtesy
          await new Promise(r => setTimeout(r, 500));
        }

        if (imageUrls.length === 0) {
          console.log(`No images found for ${product.product_code}`);
          failed++;
          continue;
        }

        // Download and upload first 3 images max
        const uploadedUrls: string[] = [];
        for (let i = 0; i < Math.min(imageUrls.length, 3); i++) {
          const publicUrl = await downloadAndUpload(imageUrls[i], product.id, i, supabase);
          if (publicUrl) uploadedUrls.push(publicUrl);
        }

        if (uploadedUrls.length > 0) {
          await supabase
            .from('products')
            .update({ images: uploadedUrls, updated_at: new Date().toISOString() })
            .eq('id', product.id);
          
          console.log(`✅ ${product.product_code}: ${uploadedUrls.length} images stored`);
          processed++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Error processing ${product.product_code}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, total: products.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Image scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
