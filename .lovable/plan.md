

# Faster Discovery Using Firecrawl Map API

## Root Problem

The current discovery scrapes each subcategory page individually via the Scrape API (1 credit per page, ~3-5s each). For `pneumatic-cylinders` with **910 detected "subcategories"**, this takes 120s+ and times out — capturing only ~475 of 46,803 products.

Worse, many "subcategories" are actually **brand filter URLs** like `?q=Brand-ASCO`, `?q=Brand-Aventics` which are filtered views of the same page, wasting time and Firecrawl credits.

## Solution: Use Firecrawl Map API

Firecrawl's **Map** endpoint discovers up to 5,000 URLs from a site in a **single API call** (~2-3 seconds, 1 credit). Instead of scraping 900+ subcategory pages one by one, we:

1. Call `map(categoryUrl, { limit: 5000 })` — gets all discoverable URLs under that path
2. Filter results through `isValvesDirectProductUrl()` — extract only product URLs
3. If the category is huge (like pneumatic-cylinders), call map multiple times with different subcategory base URLs

This is **100x faster** and uses far fewer credits.

## Implementation Plan

### Step 1: Add Map-based discovery mode to `product-discover-categories/index.ts`

New strategy:
1. First, try `map(categoryUrl, { limit: 5000 })` — fast bulk URL discovery
2. Filter returned URLs through product URL pattern
3. If map returns URLs, also extract subcategory URLs and map those too (for deep categories)
4. Fall back to current scrape-based approach only if map returns 0 results
5. **Filter out query-string URLs** (`?q=Brand-*`) from subcategory detection — these are filter views, not real subcategories

### Step 2: Add "skip if fully imported" logic

Before discovery, query the database:
- Count `scrape_jobs` WHERE `source_url LIKE '%category-path%'` AND `status != 'imported'`
- If all existing jobs for that source domain path are `imported`, report "already complete" and skip
- This saves time on categories that are already fully processed

### Step 3: Fix subcategory filter to exclude query-string filter URLs

Add to `isValvesDirectSubcategoryUrl`:
- Reject URLs with `?q=` query params (brand/accessory filters)
- Reject URLs with `#` fragments
- This alone would have prevented scraping ~780 of those 910 "subcategories"

### Step 4: UI improvements in `ProductImport.tsx`

- Show a "Map Discovery" option alongside existing discovery (faster mode)
- When discovering a single source link, show estimated total products on the source vs how many we already have

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/product-discover-categories/index.ts` | Add Map API as primary discovery method, filter out query-string subcategories, add skip-if-complete check |
| `src/pages/admin/ProductImport.tsx` | UI updates for map-based discovery feedback |
| `src/lib/api/firecrawl.ts` | Already has `map()` method — no changes needed |

## Expected Impact
- Discovery of `pneumatic-cylinders` goes from 120s/475 products to ~10-20s/5000+ products per map call
- Firecrawl credits used: ~5-10 per category instead of ~900
- Categories already fully imported get auto-skipped
- No more wasted scraping of brand filter URLs

