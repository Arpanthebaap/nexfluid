// Build-time sitemap generator. Writes static XML files to /public so they're
// served from the same domain (nexfluid.it / nexfluid.com) — required by
// Google Search Console.
//
// Outputs:
//   public/sitemap.xml                  (sitemap index)
//   public/sitemap-static.xml           (home, /categories, /contact, /about)
//   public/sitemap-categories.xml       (all active categories)
//   public/sitemap-products-N.xml       (products, chunked at 10k each)

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, "../public");
mkdirSync(PUBLIC_DIR, { recursive: true });

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://xhejomioyecdfpvmohqh.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZWpvbWlveWVjZGZwdm1vaHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MDg1NTksImV4cCI6MjA4OTQ4NDU1OX0.IlnPSEx0PNp_q8W_gSPT3XKJQKeGYGy1Pl3eUdjtYIg";

const IT = "https://nexfluid.it";
const EN = "https://nexfluid.com";
const CHUNK = 10000;

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const altLinks = (path) =>
  `    <xhtml:link rel="alternate" hreflang="it" href="${IT}${path}" />
    <xhtml:link rel="alternate" hreflang="en" href="${EN}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${IT}${path}" />`;

const urlEntry = (path, { lastmod, changefreq, priority }) => `  <url>
    <loc>${IT}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${altLinks(path)}
  </url>`;

const wrap = (body) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

const write = (name, content) => {
  const p = resolve(PUBLIC_DIR, name);
  writeFileSync(p, content);
  console.log(`✓ ${name} (${(content.length / 1024).toFixed(1)} KB)`);
};

async function fetchAll(table, select, filterFn) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  const out = [];
  let offset = 0;
  const size = 1000;
  while (true) {
    let q = supabase.from(table).select(select).range(offset, offset + size - 1);
    q = filterFn(q);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < size) break;
    offset += size;
  }
  return out;
}

async function main() {
  console.log("Generating sitemaps…");

  // Static
  const staticPaths = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/categories", priority: "0.8", changefreq: "weekly" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
    { path: "/about", priority: "0.5", changefreq: "monthly" },
  ];
  write(
    "sitemap-static.xml",
    wrap(staticPaths.map((s) => urlEntry(s.path, s)).join("\n"))
  );

  // Categories
  const categories = await fetchAll(
    "categories",
    "slug, updated_at",
    (q) => q.eq("is_active", true)
  );
  const catBody = categories
    .map((c) =>
      urlEntry(`/categories/${xmlEscape(c.slug)}`, {
        lastmod: c.updated_at ? c.updated_at.split("T")[0] : "",
        changefreq: "weekly",
        priority: "0.8",
      })
    )
    .join("\n");
  write("sitemap-categories.xml", wrap(catBody));
  console.log(`  ${categories.length} categories`);

  // Products (chunked)
  const products = await fetchAll(
    "products",
    "slug, updated_at",
    (q) => q.eq("is_active", true).eq("status", "published")
  );
  console.log(`  ${products.length} products`);

  const productFiles = [];
  for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK);
    const body = chunk
      .map((p) =>
        urlEntry(`/products/${xmlEscape(p.slug)}`, {
          lastmod: p.updated_at ? p.updated_at.split("T")[0] : "",
          changefreq: "monthly",
          priority: "0.7",
        })
      )
      .join("\n");
    const name = `sitemap-products-${productFiles.length + 1}.xml`;
    write(name, wrap(body));
    productFiles.push(name);
  }

  // Sitemap index — references all sub-sitemaps on both domains.
  // Google fetches whichever domain you submit; alternates handled inside.
  const today = new Date().toISOString().split("T")[0];
  const subFiles = ["sitemap-static.xml", "sitemap-categories.xml", ...productFiles];
  const indexBody = subFiles
    .map(
      (f) => `  <sitemap>
    <loc>${IT}/${f}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
    )
    .join("\n");

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexBody}
</sitemapindex>
`;
  write("sitemap.xml", indexXml);
  console.log(`Done. ${subFiles.length} sub-sitemaps indexed.`);
}

main().catch((e) => {
  console.error("Sitemap generation failed:", e);
  process.exit(1);
});
