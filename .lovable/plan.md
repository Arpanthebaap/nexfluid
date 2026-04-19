

## Audit Findings

| Metric | Count |
|--------|------:|
| Total published products | 42,995 |
| Products with real scraped images | 35,967 (83.7%) |
| Products with NO image at all | 7,028 (16.3%) |
| — of which still have `raw_data` from scrape_jobs | 7,028 (100%) |
| — of which have a category with an `image_url` | 7,028 (100%) |
| Products using Nexfluid logo / branded placeholder as image | 0 |

Good news: there are no fake "branded placeholder" or "logo-only" entries stored in the DB. The placeholder is purely a runtime UI fallback. The real gap is the **7,028 products with an empty `images` array**.

## Strategy (two-pass, cost-optimized)

We already have `product-image-scrape` deployed which extracts real product images from the cached `raw_data.markdown` first (free), and only falls back to Firecrawl if needed. Since 100% of missing-image products still have `raw_data`, **Pass 1 will be virtually free** — no Firecrawl/AI credits needed.

### Pass 1 — Extract real images from existing `raw_data` (free, ~5 min)
Run `product-image-scrape` repeatedly in batches of 50. It already:
- Reads `scrape_jobs.raw_data.markdown` for `![](...)` image URLs
- Downloads them and stores in the `product-images` Supabase bucket
- Updates `products.images` with public URLs

Most of the 7,028 should be solved here since the original valves-direct.com pages had image markdown.

### Pass 2 — Category-image fallback for stragglers (free, instant SQL)
For any product still empty after Pass 1, run a single SQL `UPDATE` that copies the resolved category `image_url` directly into `products.images` as a JSONB array:
```sql
UPDATE products p
SET images = jsonb_build_array(c.image_url),
    updated_at = now()
FROM categories c
WHERE p.category_id = c.id
  AND p.is_active = true AND p.status = 'published'
  AND (p.images IS NULL OR jsonb_array_length(p.images) = 0)
  AND c.image_url IS NOT NULL AND c.image_url != '';
```
This guarantees **100% coverage** with a real category image (not a placeholder) so SEO/OG tags, sitemaps, and listing pages all serve a meaningful image.

### Why no AI image generation?
- 7,028 unique generations would cost real money (~$70+ at gemini-3-pro-image rates) for negligible gain over the relevant category image.
- The end-category images are already topic-accurate (cylinder / solenoid valve / etc.) and brand-neutral.
- User explicitly approved category-image fallback as acceptable.

## Tweaks to `product-image-scrape` before running
- Increase `batchSize` default from 5 → 50 (raw_data path is fast, no Firecrawl call)
- Add a guard: skip Firecrawl scraping when `firecrawlKey` is missing or when raw_data already yielded zero useful URLs (to avoid burning credits during this audit run)
- Make sure it picks `*-large_default*.jpg` URLs (the high-quality variant on valves-direct) over thumbnails

## Execution Plan

1. Update `supabase/functions/product-image-scrape/index.ts`: bigger default batch, prefer `large_default` URLs, skip Firecrawl during this audit (raw_data only).
2. Trigger the function in a loop from a one-shot script until `processed === 0` (signals queue empty).
3. Run the SQL UPDATE to fill remaining empties with category image.
4. Final verification query confirming 0 products with empty `images`.

## Files / Operations

| Operation | Target |
|-----------|--------|
| Modify | `supabase/functions/product-image-scrape/index.ts` |
| Deploy | same edge function |
| Invoke (loop) | `product-image-scrape` until queue drained |
| SQL UPDATE | `products` table — category image fallback |
| Verify | SELECT COUNT confirming 0 empties |

After this, every one of the 42,995 products will have at least one real image URL stored in the DB.

