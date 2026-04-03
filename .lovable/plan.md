

# Fix: Brand Pages Missing Uncategorized Products

## Root Cause

The brand page only shows products grouped by category. But most products have **no category assigned**:

| Brand | Total | With Category | Missing |
|-------|-------|---------------|---------|
| PARKER | 42 | 5 | **37** |
| JOUCOMATIC | 3 | 0 | **3** |
| ASCO | 6,429 | 3,993 | **2,436** |
| AVENTICS | 5,342 | 4,011 | **1,331** |
| NUMATICS | 228 | 62 | **166** |
| EMERSON | 13 | 11 | **2** |
| SIRAI | 34 | 34 | 0 |

The `get_brand_category_counts` RPC filters out `category_id IS NOT NULL`, so uncategorized products are completely invisible on brand pages.

## Solution

Add an "All Products" / "Uncategorized" section to the brand page so no products are missed:

### 1. Update RPC function (`get_brand_category_counts`)
- Also return a count for `category_id IS NULL` products (using a special sentinel UUID or a separate query)

### 2. Update BrandPage (`src/pages/BrandPage.tsx`)
- On the brand landing page (no slug), show:
  - Category grid as before (for categorized products)
  - An additional "All Products" card at the top showing the **total** product count for the brand
- Add a special route `/brands/:brandName/all` that shows **all** brand products (regardless of category) with pagination
- When `brandCounts.size === 0` but uncategorized products exist, still show the "All Products" card (fixes JOUCOMATIC showing empty)
- Fix the guard on line 90: `if (allCategories.length === 0 || brandCounts.size === 0) return;` — this blocks rendering entirely when a brand has zero categorized products (like JOUCOMATIC)

### 3. No database migration needed
- We can fetch the uncategorized count with a separate client-side query: `SELECT COUNT(*) FROM products WHERE brand ILIKE 'X' AND category_id IS NULL AND is_active AND status='published'`
- Or add an "All Products" card that queries total count directly

## Technical approach

The simplest and most robust fix:

1. **Add a total brand product count** query alongside the RPC call (one extra query: count all products for this brand regardless of category)
2. **Add an "All Products" card** as the first card in the category grid, linking to `/brands/:brandName/all`
3. **Handle `/brands/:brandName/all`** route: when slug is `"all"`, skip category filtering and show all brand products paginated
4. **Fix the empty-state guard**: remove the `brandCounts.size === 0` check that blocks rendering

## Files to modify
| File | Change |
|------|--------|
| `src/pages/BrandPage.tsx` | Add total count query, "All Products" card, handle `all` slug, fix empty guard |

