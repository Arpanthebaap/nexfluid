import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
};

function refererFor(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return 'https://www.valves-direct.com/';
  }
}

function pickExt(contentType: string, url: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('svg')) return 'svg';
  if (/\.png(\?|$)/i.test(url)) return 'png';
  if (/\.webp(\?|$)/i.test(url)) return 'webp';
  if (/\.gif(\?|$)/i.test(url)) return 'gif';
  return 'jpg';
}

function safeKey(s: string): string {
  return (s || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

async function mirrorOne(
  imageUrl: string,
  productCode: string,
  index: number,
  supabase: any
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...BROWSER_HEADERS, 'Referer': refererFor(imageUrl) },
      redirect: 'follow',
    });
    if (!res.ok) {
      console.log(`fetch ${res.status} for ${imageUrl}`);
      return null;
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 2000) return null; // skip pixel/spinner

    const ext = pickExt(contentType, imageUrl);
    const filePath = `${safeKey(productCode)}/${index}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(filePath, buf, { contentType, upsert: true });

    if (upErr) {
      console.error(`upload err ${filePath}: ${upErr.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    return urlData?.publicUrl || null;
  } catch (e) {
    console.error(`mirrorOne error: ${e}`);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { batchSize = 25 } = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pull pending products that have at least one external image
    const { data: products, error: fetchErr } = await supabase
      .from('products')
      .select('id, product_code, images')
      .eq('mirror_status', 'pending')
      .eq('is_active', true)
      .limit(batchSize);

    if (fetchErr) {
      return new Response(
        JSON.stringify({ success: false, error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!products?.length) {
      // Report remaining count so the driver knows when to stop
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('mirror_status', 'pending');
      return new Response(
        JSON.stringify({ success: true, processed: 0, mirrored: 0, failed: 0, remaining: count ?? 0, done: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let mirrored = 0;
    let failed = 0;

    for (const p of products) {
      const original = Array.isArray(p.images) ? (p.images as string[]) : [];
      const externalUrls = original.filter(
        (u) =>
          typeof u === 'string' &&
          /^https?:\/\//i.test(u) &&
          !u.includes('xhejomioyecdfpvmohqh.supabase.co') &&
          // Skip RS-Online brand banner logos (e.g. /brand/M2150-01.jpg) — never product images
          !/media\.rs-online\.com\/brand\//i.test(u)
      );

      // No external URLs to mirror — mark done
      if (externalUrls.length === 0) {
        await supabase
          .from('products')
          .update({ mirror_status: 'done', updated_at: new Date().toISOString() })
          .eq('id', p.id);
        continue;
      }

      const newUrls: string[] = [];
      // Cap at 3 images per product
      for (let i = 0; i < Math.min(externalUrls.length, 3); i++) {
        const publicUrl = await mirrorOne(externalUrls[i], p.product_code, i, supabase);
        if (publicUrl) newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        await supabase
          .from('products')
          .update({
            images: newUrls,
            mirror_status: 'done',
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.id);
        mirrored++;
      } else {
        // Mirror failed entirely → wipe images so frontend falls back to placeholder
        await supabase
          .from('products')
          .update({
            images: [],
            mirror_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.id);
        failed++;
      }
    }

    const { count: remaining } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('mirror_status', 'pending');

    return new Response(
      JSON.stringify({
        success: true,
        processed: products.length,
        mirrored,
        failed,
        remaining: remaining ?? 0,
        done: (remaining ?? 0) === 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Image mirror error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
