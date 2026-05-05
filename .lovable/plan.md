# Contextual Brand Display

When a user reaches a co-branded product through a specific brand page or brand-filtered search, the product detail page will display that brand instead of the primary one. SEO and canonical data stay anchored to the primary brand.

## Changes

### 1. `src/pages/ProductDetail.tsx`
- Read `from` via `useSearchParams()`.
- Fetch `brands` array alongside existing product fields.
- Compute `displayBrand`:
  - If `from` exists and matches (case-insensitive) any value in `product.brands`, use the canonical-cased version of `from`.
  - Otherwise fall back to `product.brand`.
- Replace visible `product.brand` usages with `displayBrand` in:
  - Product info card header (`{displayBrand} {product_code}`)
  - `BrandedProductImage` `brand` prop
  - Related products section (pass `displayBrand` through if from same brand context)
- Keep `product.brand` (primary) for:
  - `<title>` and meta description
  - Schema.org `Product.brand`
  - Canonical link
- Add `<link rel="canonical" href="https://nexfluid.{it|com}/products/{slug}">` so `?from=` variants don't fragment SEO.

### 2. `src/pages/BrandPage.tsx`
- Append `?from=<BRAND>` to every product `<Link to=...>`.

### 3. `src/pages/SearchResults.tsx`
- When the active brand filter has exactly one brand selected, append `?from=<BRAND>` to product links. Otherwise no param (use primary).

## Not changing
- DB schema, `products.brand`, `products.brands`
- Import / AI pipelines
- Sitemap, hreflang, structured data brand value
- Mobile / tablet layouts
- Quote requests (still record primary brand)
- Listing card layouts

## Result
- `/brands/JOUCOMATIC` → click *ASCO JOUCOMATIC 43701278* → detail shows **JOUCOMATIC**.
- `/brands/ASCO` → same product → shows **ASCO**.
- Direct Google / shared link → shows primary **ASCO** (canonical).
- Single DB row, no SEO duplication, no UI clutter for single-brand products.