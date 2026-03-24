import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://nexfluid.it";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true);

    // Fetch all published products in batches (may exceed 1000)
    let allProducts: { slug: string; updated_at: string }[] = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const { data: batch } = await supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_active", true)
        .eq("status", "published")
        .range(offset, offset + batchSize - 1);
      if (!batch || batch.length === 0) break;
      allProducts = allProducts.concat(batch);
      if (batch.length < batchSize) break;
      offset += batchSize;
    }

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    // Category URLs
    for (const cat of categories || []) {
      const lastmod = cat.updated_at ? cat.updated_at.split("T")[0] : "";
      xml += `
  <url>
    <loc>${SITE_URL}/categories/${cat.slug}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Product URLs
    for (const prod of allProducts) {
      const lastmod = prod.updated_at ? prod.updated_at.split("T")[0] : "";
      xml += `
  <url>
    <loc>${SITE_URL}/products/${prod.slug}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
  }
});
