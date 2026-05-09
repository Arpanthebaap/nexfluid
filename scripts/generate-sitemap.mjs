// Build-time sitemap generator. Writes static XML files to /public so they're
// served from the same domain (nexfluid.it / nexfluid.com).
//
// Domain-specific outputs (each contains URLs for ONE language only):
//   public/sitemap-it.xml             (IT index → IT sub-sitemaps with .it URLs)
//   public/sitemap-en.xml             (EN index → EN sub-sitemaps with .com URLs)
//   public/sitemap.xml                (alias of sitemap-it.xml for backwards compat)
//   public/sitemap-{lang}-static.xml
//   public/sitemap-{lang}-categories.xml
//   public/sitemap-{lang}-products-N.xml
//
// robots.txt lists BOTH sitemap-it.xml and sitemap-en.xml so each GSC property
// can be pointed at the appropriate language-only sitemap.

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

const ORIGINS = {
  it: "https://nexfluid.it",
  en: "https://nexfluid.com",
};
const CHUNK = 10000;

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Single-language URL entry. Self-referencing only — no cross-domain alternates
// inside the sitemap so each domain's sitemap contains ONLY its own URLs.
const urlEntry = (origin, path, { lastmod, changefreq, priority }) =>
  `  <url>
    <loc>${origin}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const wrap = (body) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
  console.log("Generating per-domain sitemaps…");

  const staticPaths = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/categories", priority: "0.8", changefreq: "weekly" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
    { path: "/about", priority: "0.5", changefreq: "monthly" },
  ];

  const categories = await fetchAll(
    "categories",
    "slug, updated_at",
    (q) => q.eq("is_active", true)
  );
  console.log(`  ${categories.length} categories`);

  const products = await fetchAll(
    "products",
    "slug, updated_at",
    (q) => q.eq("is_active", true).eq("status", "published")
  );
  console.log(`  ${products.length} products`);

  const today = new Date().toISOString().split("T")[0];

  // Generate the same set of files for each language, prefixed by lang.
  for (const lang of ["it", "en"]) {
    const origin = ORIGINS[lang];

    write(
      `sitemap-${lang}-static.xml`,
      wrap(staticPaths.map((s) => urlEntry(origin, s.path, s)).join("\n"))
    );

    write(
      `sitemap-${lang}-categories.xml`,
      wrap(
        categories
          .map((c) =>
            urlEntry(origin, `/categories/${xmlEscape(c.slug)}`, {
              lastmod: c.updated_at ? c.updated_at.split("T")[0] : "",
              changefreq: "weekly",
              priority: "0.8",
            })
          )
          .join("\n")
      )
    );

    const productFiles = [];
    for (let i = 0; i < products.length; i += CHUNK) {
      const chunk = products.slice(i, i + CHUNK);
      const body = chunk
        .map((p) =>
          urlEntry(origin, `/products/${xmlEscape(p.slug)}`, {
            lastmod: p.updated_at ? p.updated_at.split("T")[0] : "",
            changefreq: "monthly",
            priority: "0.7",
          })
        )
        .join("\n");
      const name = `sitemap-${lang}-products-${productFiles.length + 1}.xml`;
      write(name, wrap(body));
      productFiles.push(name);
    }

    const subFiles = [
      `sitemap-${lang}-static.xml`,
      `sitemap-${lang}-categories.xml`,
      ...productFiles,
    ];
    const indexBody = subFiles
      .map(
        (f) => `  <sitemap>
    <loc>${origin}/${f}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
      )
      .join("\n");
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexBody}
</sitemapindex>
`;
    write(`sitemap-${lang}.xml`, indexXml);
  }

  // Default sitemap.xml = Italian (primary domain). nexfluid.com should submit
  // sitemap-en.xml in GSC.
  const itIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${ORIGINS.it}/sitemap-it.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;
  write("sitemap.xml", itIndex);

  console.log("Done.");
}

main().catch((e) => {
  console.error("Sitemap generation failed:", e);
  process.exit(1);
});
