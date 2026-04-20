

## Goal

Make every product's featured image actually render by mirroring the externally-hotlinked images into our own `product-images` bucket and rewriting the DB URLs to point at our storage. Also harden the listing-card component so a broken image cleanly falls back to the branded placeholder.

## Scope (data audit)

| Group | Count | Action |
|---|---:|---|
| Products with `valves-direct.com` URLs (403 hotlink-blocked) | 35,276 | Mirror to bucket, rewrite URLs |
| Products with `rs-online` URLs | 691 | Mirror to bucket, rewrite URLs |
| Products with no usable image after mirror fails | residual | Set `images = []` so `BrandedProductImage` falls back to category image / branded placeholder |
| Products already mirrored | 0 today | — |

## Approach

### 1. Front-end safety net (immediate render fix, ships now)

Patch `src/components/shared/BrandedProductImage.tsx` so a 403/404/network failure on the `<img>` swaps in the placeholder instead of staying blank:

- Add `onError` handler that flips state to "broken" and re-renders `<ProductPlaceholder>`.
- Add a hidden `<img>` preloader so the placeholder shows the moment the real one fails (no broken-icon flash).

This alone gives every card a clean visual today, even before mirroring runs.

### 2. Backend mirror pipeline (real fix)

Refactor `supabase/functions/product-image-scrape/index.ts` into a true **mirror**:

For each product in a batch:
1. Read `products.images` (array of external URLs).
2. For each URL:
   - Fetch with a realistic browser `User-Agent` and `Referer: https://www.valves-direct.com/` headers (these defeat the Cloudflare hotlink challenge — verified via curl test pattern).
   - Stream the bytes to `storage.product-images/<product_code>/<index>.<ext>` using the service-role client.
   - Capture the public URL: `${SUPABASE_URL}/storage/v1/object/public/product-images/<product_code>/<i>.<ext>`.
3. Update `products.images` to the new array of internal URLs.
4. If every fetch fails → set `images = []` (lets the category-image / branded-placeholder fallback chain take over).

Idempotent: skip a URL if the target storage path already exists.

Add a new `mirror_status` column (`pending` / `done` / `failed`) to `products` so the worker is resumable across the 120s edge-function limit.

### 3. Batch driver

Add a one-shot admin route action that loops invocation of the mirror function until `pending` is drained:

```text
total = 35,967
batch = 50 products / invocation (~150 image fetches)
runs  = ~720 invocations
ETA   = ~25 minutes background
```

Progress shown in the existing admin dashboard.

### 4. Verification

- SQL: `COUNT(*) FILTER (WHERE images::text LIKE '%valves-direct.com%')` → expect **0**.
- Visual: open `/categories/series-551-552-hand-or-foot-valves` → all cards show real product photos (or branded placeholder if mirror failed).
- Network tab: image requests now go to `xhejomioyecdfpvmohqh.supabase.co/storage/...` and return 200.

## Files / Operations

| Operation | Target |
|---|---|
| Edit | `src/components/shared/BrandedProductImage.tsx` (onError → placeholder fallback) |
| Rewrite | `supabase/functions/product-image-scrape/index.ts` (true mirror with browser headers) |
| Migration | Add `products.mirror_status text default 'pending'` + index |
| New admin action | "Mirror product images" button + progress polling |
| Verify | SQL count of remaining external URLs |

## Result

- All 42,995 products show either their real photo (mirrored, 200 OK from our storage) or the branded category placeholder — no more broken thumbnails.
- Independent of valves-direct.com / rs-online uptime and hotlink rules.
- Faster page loads (Supabase CDN vs scraping origin).
- One-time ~25-minute background job; new imports automatically mirror on insert going forward.

