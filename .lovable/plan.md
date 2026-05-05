## Goal

Let one product belong to multiple authorized brands so co-branded items (e.g. *"ASCO JOUCOMATIC 356..."*) appear on **both** brand pages, while keeping a single product row, single product code, and clean SEO.

Authorized brands only: `PARKER, ASCO, AVENTICS, JOUCOMATIC, NUMATICS, EMERSON, SIRAI`.

Detail page stays clean — no "Also available under" line. Multi-brand stays internal/filter-only.

## Plan

### Step 1 — Database migration
- Add `brands text[] NOT NULL DEFAULT '{}'` to `products`.
- Add a GIN index on `brands` for fast brand-page filtering.
- Backfill in the same migration:
  - For every published product, set `brands` to the **deduped union** of:
    - the existing `brand` value (if any), and
    - every authorized brand token detected (case-insensitive, word-boundary) in `name_en` and `name_it`.
  - Forbidden brands are ignored (already filtered out at import).

### Step 2 — Update brand-page query
- `src/pages/BrandPage.tsx` currently filters `WHERE brand ILIKE :brand`.
- Switch to: `WHERE :brand = ANY(brands) OR brand ILIKE :brand` (the OR keeps it safe for any product whose `brands` array hasn't been backfilled yet).
- Update the `get_brand_category_counts` RPC the same way so per-category counts on the brand page include co-branded products.

### Step 3 — Update import / AI pipeline
- `supabase/functions/product-bulk-insert/index.ts`: after determining `brand`, scan `name_en` + `name_it` for authorized brand tokens and write the deduped union into `brands` on both INSERT and UPDATE paths.
- `supabase/functions/product-ai-process/index.ts`: include the same detection so newly processed products are co-branded automatically before they reach bulk-insert.

### Step 4 — Search + filters
- `src/pages/SearchResults.tsx`: brand filter chip uses `brands` array (`brands @> ARRAY[:brand]` semantics) so a JOUCOMATIC filter also returns ASCO+JOUCOMATIC products.
- Any other shared brand filter reads from the `brands` array.

### Step 5 — Display logic (intentionally minimal)
- Product cards and product detail page keep showing only the **primary** `brand`. No "Also available under" line.
- No visible UI change for single-brand products.

### Step 6 — Audit
- Verify on the JOUCOMATIC brand page: previously ASCO-only co-branded products now appear.
- Verify ASCO page still shows the same products (no loss).
- Spot-check counts on the brand-page category sidebar.
- Confirm `product_code` uniqueness is intact and no duplicate rows were created.

## Technical details

**DB migration**
```sql
ALTER TABLE public.products
  ADD COLUMN brands text[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_products_brands ON public.products USING GIN (brands);

-- Backfill: union of existing brand + authorized tokens detected in names
WITH detected AS (
  SELECT p.id,
    ARRAY(
      SELECT DISTINCT b FROM unnest(ARRAY[
        'PARKER','ASCO','AVENTICS','JOUCOMATIC','NUMATICS','EMERSON','SIRAI'
      ]) AS b
      WHERE (p.name_en ILIKE '%'||b||'%' OR p.name_it ILIKE '%'||b||'%')
         OR upper(coalesce(p.brand,'')) = b
    ) AS brand_list
  FROM public.products p
)
UPDATE public.products p
SET brands = d.brand_list
FROM detected d
WHERE p.id = d.id;
```

**Brand-page count RPC** (`get_brand_category_counts`) — change predicate to:
```
WHERE p.is_active = true
  AND p.status = 'published'
  AND (_brand = ANY(p.brands) OR p.brand ILIKE _brand)
  AND p.category_id IS NOT NULL
```

**Edge function brand-detection helper** (used in both `product-bulk-insert` and `product-ai-process`):
```ts
const AUTHORIZED = ['PARKER','ASCO','AVENTICS','JOUCOMATIC','NUMATICS','EMERSON','SIRAI'];
function detectBrands(name: string, primary?: string | null): string[] {
  const u = (name || '').toUpperCase();
  const found = AUTHORIZED.filter(b => new RegExp(`\\b${b}\\b`).test(u));
  if (primary) {
    const p = primary.toUpperCase();
    if (AUTHORIZED.includes(p) && !found.includes(p)) found.push(p);
  }
  return found;
}
```

**Files edited**
- DB migration (new) — column, index, backfill, RPC update.
- `supabase/functions/product-bulk-insert/index.ts`
- `supabase/functions/product-ai-process/index.ts`
- `src/pages/BrandPage.tsx`
- `src/pages/SearchResults.tsx`

**Files NOT touched**
- `categories`, images, listing card layouts, mobile/tablet views, product detail UI.
- `product_code` uniqueness — preserved.

## Result

- A product named *"ASCO JOUCOMATIC 356-0001"* with `brand = 'ASCO'` will appear on both `/brands/ASCO` and `/brands/JOUCOMATIC`.
- Same for any future co-brand combinations across the 7 authorized brands (e.g. ASCO+NUMATICS, AVENTICS+EMERSON).
- One row per product. Clean SEO, clean analytics, clean quotes. No visible UI change for single-brand products.
