

## Audit (Root Cause Found)

The Parker products **don't** have a missing/broken image — they have a **bad first image**. The rs-online importer captured the Parker brand banner (`https://media.rs-online.com/brand/M2150-01.jpg`) as `images[0]`, and the actual product photo as `images[1]`.

```
images = [
  "https://media.rs-online.com/brand/M2150-01.jpg",   ← Parker logo (always [0])
  "https://media.rs-online.com/.../Y2633035-01"        ← real product image
]
```

`BrandedProductImage` always uses `images[0]`, the logo loads with HTTP 200, the `onError` fallback never fires, so every Parker card shows the Parker logo. Affects exactly **691 products** (all rs-online Parker imports). Valves-direct products (42,304) are unaffected.

## Fix — Two Layers

### 1. Data cleanup (one SQL migration, instant fix for all 691)
Strip any `media.rs-online.com/brand/...` URLs out of every product's `images` array. After this, `images[0]` becomes the real product image.

```sql
UPDATE products
SET images = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements_text(images) AS elem
  WHERE elem NOT LIKE '%media.rs-online.com/brand/%'
),
mirror_status = 'pending'
WHERE images::text LIKE '%media.rs-online.com/brand/%';
```

After this runs:
- Products that had `[logo, real_image]` → become `[real_image]` → real photo shows.
- The handful with only the logo → become `[]` → fallback chain kicks in → end-category image shows (`/categories/hydraulic.jpg` for the Raccordi page) → branded placeholder if even that fails.

### 2. Importer guard (prevent recurrence)
Patch `supabase/functions/product-image-scrape/index.ts` (and any rs-online image extraction) to filter out `media.rs-online.com/brand/` URLs at ingest time so future imports never re-introduce the logo.

### 3. Bonus — kick off the mirror job
After cleanup, the cleaned rs-online URLs are still external and may hotlink-fail. The existing "Mirror pending" admin button will now mirror the **correct** image to our bucket. Since cleanup resets `mirror_status='pending'` for the 691 affected rows, the next mirror run will replace them with internal Supabase URLs.

## Files / Operations

| Operation | Target |
|---|---|
| Migration | One UPDATE on `products` to strip brand-logo URLs from `images` (691 rows) |
| Edit | `supabase/functions/product-image-scrape/index.ts` — skip `/brand/` URLs during scrape |
| (Optional, user-triggered) | Click "Mirror pending" in admin Dashboard to permanently mirror the now-correct images |

## Expected Result

- **Immediately**: All 691 Parker product cards on `/categories/raccordi-per-idraulica` (and everywhere else) show the real product photo instead of the Parker logo. Where the real photo fails to load, the end-category image (Hydraulic) shows as the branded fallback, then placeholder.
- **Going forward**: New rs-online imports will never capture brand logos again.
- **No new images generated**, no AI cost, no extra storage beyond the existing mirror pipeline.

