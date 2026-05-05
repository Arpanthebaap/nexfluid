import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const IT = "https://nexfluid.it";
const EN = "https://nexfluid.com";

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const buildAlt = (path: string) =>
  `    <xhtml:link rel="alternate" hreflang="it" href="${IT}${path}" />
    <xhtml:link rel="alternate" hreflang="en" href="${EN}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${IT}${path}" />`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true);

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

    const staticPaths = [
      { path: "/", priority: "1.0", changefreq: "daily" },
      { path: "/categories", priority: "0.8", changefreq: "weekly" },
      { path: "/contact", priority: "0.6", changefreq: "monthly" },
      { path: "/about", priority: "0.5", changefreq: "monthly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    for (const s of staticPaths) {
      xml += `
  <url>
    <loc>${IT}${s.path}</loc>
    <changefreq>${s.changefreq}</changefreq>
    <priority>${s.priority}</priority>
${buildAlt(s.path)}
  </url>`;
    }

    for (const cat of categories || []) {
      const path = `/categories/${xmlEscape(cat.slug)}`;
      const lastmod = cat.updated_at ? cat.updated_at.split("T")[0] : "";
      xml += `
  <url>
    <loc>${IT}${path}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${buildAlt(path)}
  </url>`;
    }

    for (const prod of allProducts) {
      const path = `/products/${xmlEscape(prod.slug)}`;
      const lastmod = prod.updated_at ? prod.updated_at.split("T")[0] : "";
      xml += `
  <url>
    <loc>${IT}${path}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${buildAlt(path)}
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Robots-Tag": "noindex",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(`Error: ${(error as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
