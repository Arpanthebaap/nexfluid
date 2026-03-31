

# Pipeline Stabilization: Selective Cleanup + Deeper Discovery + Hybrid Category Alignment

## Problems Identified

### 1. Failed jobs recycling endlessly
The **"Retry Failed"** button resets ALL failed jobs to pending -- including permanently unfixable ones (non-whitelisted brands, no content). These then fail again immediately, wasting cycles. The discovery requeue logic also resets failed brand-rejected jobs back to pending every run.

### 2. Discovery only finds ~200 products per category (out of thousands)
The scrape fallback only discovers products visible on the **first page** of each subcategory. Valves-direct has paginated listings (e.g., `?page=2`, `?page=3`), and the pipeline never visits page 2+. The Map API returns only 1 URL for valves-direct (the site blocks it). So we're limited to whatever links appear on the first page load of each subcategory -- typically 12-20 products per subcat.

### 3. Category alignment gaps
Some products end up with no category or wrong category because the URL slug extraction (`extractCategorySlug`) only looks at the second-to-last path segment, which for some URL structures doesn't map to any existing category.

## Fix Plan

### Step 1: Selective failed-job cleanup

**File: `src/pages/admin/ProductImport.tsx`**

Replace the "Retry Failed" button with two actions:
- **"Delete Permanent Failures"** -- deletes failed jobs where `error_message` contains known permanent failure patterns: `non-whitelisted brand`, `Pre-filter`, `URL pre-filter`, `Invalid brand`, `No scraped content`
- **"Retry Transient Failures"** -- resets only jobs with transient error patterns (network errors, timeouts, AI errors) back to pending

**File: `supabase/functions/product-discover-categories/index.ts`**

Stop the requeue logic from resetting brand-rejected failures. Add a filter: only requeue jobs where `error_message NOT ILIKE '%brand%' AND error_message NOT ILIKE '%pre-filter%'`.

### Step 2: Paginated discovery for valves-direct

**File: `supabase/functions/product-discover-categories/index.ts`**

The core discovery gap: valves-direct subcategories have hundreds of pages. Currently we scrape page 1 only. Fix:

1. After scraping a subcategory page and extracting product links, check if pagination links exist (look for `?page=` patterns in the scraped links)
2. If pagination found, extract the max page number
3. Scrape pages 2 through N (up to a reasonable limit like page 50) within the safety timer
4. This multiplies discovery by 10-50x per subcategory

The scrape fallback currently gets ~12 products per subcat page. With pagination, a subcat with 500 products across 25 pages would yield all 500.

Logic addition inside the scrape fallback subcategory loop:
```
for each subcatUrl:
  links = scrapeLinks(subcatUrl)  // page 1
  products += filter(links)
  
  // NEW: check for pagination
  pageLinks = links.filter(l => l.includes('?page='))
  maxPage = extractMaxPage(pageLinks)  // e.g., 25
  for page 2..min(maxPage, 50):
    if !isTimeSafe() break
    pageLinks = scrapeLinks(subcatUrl + '?page=' + page)
    products += filter(pageLinks)
```

### Step 3: Hybrid strict category alignment

**File: `supabase/functions/product-ai-process/index.ts`**

Add a secondary slug mapping layer for valves-direct URL patterns. The current `extractCategorySlug` only checks the second-to-last segment. Enhance with:

1. A static mapping of common valves-direct category slugs to internal category IDs/slugs (e.g., `solenoid-valves` -> the right leaf category)
2. If the URL slug doesn't match directly, try matching the parent category slug (first segment like `10-solenoid-valves`)
3. Only fall through to AI category matching when both URL-based approaches fail

**File: `supabase/functions/product-bulk-insert/index.ts`**

Add a similar fallback: if `category_id` is still null at import time, try the URL-based mapping one more time before inserting without a category.

### Step 4: Source registry in admin

**File: `src/pages/admin/ProductImport.tsx`**

Make the `SOURCE_CATEGORY_URLS` array editable from the UI:
- Add a collapsible "Source Links" section showing all current source URLs
- Allow adding/removing URLs
- Store in a simple `source_links` table or localStorage initially
- Show per-source-link stats: how many products discovered, how many imported, how many remaining

This lets you add brand-specific pages like `valves-direct.com/10-solenoid-valves/asco/` to target specific brands within categories.

## Files to modify

| File | Change |
|------|--------|
| `src/pages/admin/ProductImport.tsx` | Split retry button into selective cleanup + transient retry; add source registry UI |
| `supabase/functions/product-discover-categories/index.ts` | Add pagination support for subcategory pages; stop requeuing brand-rejected failures |
| `supabase/functions/product-ai-process/index.ts` | Enhanced URL-to-category mapping with parent slug fallback |
| `supabase/functions/product-bulk-insert/index.ts` | Secondary category fallback at import time |
| New migration | Create `source_links` table (url, label, is_active, last_discovered_at, product_count) |

## Expected Impact
- Failed jobs stop recycling (permanent failures deleted, transient ones retried)
- Discovery coverage increases from ~200 to thousands per category via pagination
- Category alignment improves with hybrid URL + AI approach
- Source links become manageable from the admin UI

