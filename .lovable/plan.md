

# Fix: Discovery Should Not Mark "Complete" Until All Products Found

## Problem

The discovery function marks itself "Complete" after it finishes iterating through all discovered subcategories and their pages. But this doesn't mean all products from the source have been found. In this case, the source has ~11,185 products but only 1,100 were discovered because:

1. **Firecrawl Map API returns max 5,000 URLs** — many subcategories are never discovered
2. **The subcategory detection only finds top-level paths** (`/10-solenoid-valves/`) but misses nested subcategories (`/10-solenoid-valves/123-sub-sub-category/`)
3. **3-consecutive-empty-page stop** may cut pagination short on deep categories
4. **No validation against actual source product count** — the function has no way to know how many products exist at the source

## Solution

### 1. Deep subcategory discovery (recursive)
The current function only finds subcategories at the first level. But valves-direct.com has deep hierarchies:
```
/10-solenoid-valves/
  /10-solenoid-valves/123-sub-category/
    /10-solenoid-valves/123-sub-category/456-sub-sub-category/
```

Modify the discovery function to recursively discover subcategories within each subcategory page. When scraping a subcategory page, also check for child subcategory links and add them to the queue.

### 2. Increase Map API limit and do multi-pass mapping
Instead of a single Map call, do multiple Map calls with different search terms or entry points to capture more URLs. Also scrape the parent category page for sub-subcategory links that Map missed.

### 3. Track discovered vs expected count
Add a total product count extraction from the source page (many category pages show "Showing X products"). Scrape this count and compare against discovered URLs to determine if discovery is truly complete.

### 4. Change "Complete" logic
Only mark "Complete" when:
- All subcategories (including nested) have been fully paginated
- OR the discovered count matches/exceeds the source page's stated product count
- Show "Partial" status with percentage when discovery found fewer than expected

### 5. Update the UI to show discovery progress
Show "Found X of ~Y products" when the source count is known, and "Partial — X found (more may exist)" instead of "Complete" when the function finishes but hasn't matched the expected count.

## Technical Details

### Edge function changes (`product-discover-categories/index.ts`)

**Recursive subcategory discovery:**
- When scraping each subcategory page, also extract child subcategory URLs (same `isValvesDirectSubcategoryUrl` check but relative to the subcategory path)
- Add newly found sub-subcategories to the processing queue
- Track which subcategories have been visited to avoid loops

**Extract expected product count from page:**
- When scraping the parent category page, look for text patterns like "Showing 1-48 of 11185" or similar pagination indicators
- Return this as `expectedTotal` in the response

**Response changes:**
```typescript
{
  // existing fields...
  expectedTotal: number | null,  // from source page
  discoveryComplete: boolean,    // true only if all subcats exhausted AND found >= expectedTotal
}
```

### Frontend changes (`ProductImport.tsx`)

- Show "Found X of ~Y" when `expectedTotal` is available
- Show "Partial" badge instead of "Complete" when `totalFound < expectedTotal`
- Add a "Continue Discovery" button that re-runs discovery with deeper recursion

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/product-discover-categories/index.ts` | Add recursive subcategory discovery, extract expected total from page, change completion logic |
| `src/pages/admin/ProductImport.tsx` | Show expected vs found counts, "Partial" status, "Continue Discovery" button |

