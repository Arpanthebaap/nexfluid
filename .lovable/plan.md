

# Single Source Link Discovery + Pipeline Check

## What I Found

### Discovery issues preventing full product capture:

1. **50-second safety timer is too aggressive** — The discovery function times out at 50s, but scraping subcategories with pagination can easily take 60-90s. Categories with many subcategories (like solenoid-valves with 10+ subcats) get cut off, missing products from later subcategories.

2. **Pagination detection is limited** — `extractPaginationUrls` only checks for `?page=` or `?p=` params. Valves-direct uses URL-path-based pagination (e.g., `/10-solenoid-valves?page=2`) which works, but some sites may use fragment-based or different patterns.

3. **Product URL pattern may miss some products** — `isValvesDirectProductUrl` requires the last path segment to start with `\d+-` and end with `.html`. If any product URLs on the source site don't follow this exact pattern, they'll be silently filtered out.

4. **No single-source-link discovery UI** — The existing "Add Specific URLs" section is for individual product URLs. There's no way to paste ONE category/subcategory page URL and discover all products within it.

## Plan

### Step 1: Add "Single Source Link Discovery" section to `ProductImport.tsx`
Add a new Card above the existing "Add Specific URLs" section with:
- A single text input for a source link (category or subcategory page URL)
- A "Discover Products" button that calls `firecrawlApi.discoverCategory(url)`
- Shows results: total found, new, requeued, timed out status
- Includes a note explaining this discovers all product links from one source page

### Step 2: Increase discovery safety timer
In `product-discover-categories/index.ts`, increase `SAFETY_LIMIT_MS` from 50,000 to 120,000ms (2 minutes) to allow full subcategory + pagination traversal. Edge functions have a 150s limit, so 120s is safe.

### Step 3: Add debug logging for filtered URLs
Add a log line showing how many links were found vs how many matched product URL patterns, so you can see if the filter is too aggressive. This helps diagnose "why are products not being discovered."

## Files to modify
| File | Change |
|------|--------|
| `src/pages/admin/ProductImport.tsx` | Add single source link discovery card with input + button |
| `supabase/functions/product-discover-categories/index.ts` | Increase safety timer to 120s, add debug logging for filtered URLs |

