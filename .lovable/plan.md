

# Fix: Single Source Link Discovery Only Scrapes 1 Page

## Root Cause

The edge function has a 120-second timeout. When discovering a category like `6-pneumatic-cylinders`, it finds subcategories with 200+ pages each. After scraping just 1-2 subcategories, it times out and returns partial results. The frontend makes only ONE call, so the remaining subcategories/pages are never scraped.

From the logs:
```
Subcat .../15-air-preparation-equipment-accessories: found pagination up to page 221
```
At ~3-5 seconds per page scrape, 221 pages = ~11 minutes. The 120s timer can handle ~30 pages max.

## Fix: Resumable Discovery with Frontend Loop

### Step 1: Add resume support to edge function

**File: `supabase/functions/product-discover-categories/index.ts`**

Add optional `startSubcatIndex` and `startPage` parameters. When the function times out, return these as `resumeFrom` in the response so the frontend knows where to continue.

Flow:
1. First call: discover subcategories list, start scraping from subcat 0, page 1
2. When timer runs low, return `{ resumeFrom: { subcatIndex: 5, page: 12 }, subcategories: [...] }`
3. Frontend calls again with those resume params, skipping already-processed subcats/pages
4. Repeat until `resumeFrom` is null (complete)

### Step 2: Frontend auto-loops until complete

**File: `src/pages/admin/ProductImport.tsx`**

Change single source discovery from a single call to a loop:
```
while (true) {
  result = await discover(url, resumeFrom, subcategories)
  totalFound += result.totalFound
  totalNew += result.totalNew
  if (!result.resumeFrom) break  // complete
  resumeFrom = result.resumeFrom
  subcategories = result.subcategories  // reuse discovered subcats
  updateUI with progress
}
```

Show live progress: "Scraping page X of subcat Y... (Z products found so far)"

### Step 3: Pass subcategory list to avoid re-discovering

On the first call, the function scrapes the parent page and discovers subcategories. On subsequent resume calls, pass the full subcategory list so it doesn't re-scrape the parent page.

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/product-discover-categories/index.ts` | Accept `startSubcatIndex`, `startPage`, `subcategories` params; return `resumeFrom` and `subcategories` when timing out |
| `src/pages/admin/ProductImport.tsx` | Loop single source discovery calls until `resumeFrom` is null; show incremental progress |

## Expected Result
- Single source discovery will scrape ALL pages across ALL subcategories, resuming across multiple edge function calls
- A category with 200+ pages will take multiple calls but will complete fully
- Progress shown in real-time: "Found X products so far, scraping subcat Y page Z..."

