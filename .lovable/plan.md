

# Pipeline Diagnosis: 3 Critical Bugs Found

## Bug 1: Discovery Returns 0 Product URLs (BROKEN)

The Firecrawl Map API returns only 1 URL per category (the page itself) and 0 product URLs. The logs confirm this across all 10 categories:

```text
Found 1 total URLs for https://www.valves-direct.com/10-solenoid-valves
Filtered to 0 product URLs
```

**Root cause**: The Map API doesn't deep-crawl this site. It returns only the input URL.

**The site has 3 levels**: Parent category → Subcategory → Product pages. For example:
- `/10-solenoid-valves` → lists subcategories like `/77-general-service-valves`
- `/77-general-service-valves` → lists products like `/series-260-.../133162-asco-...html`

**Fix**: Replace Map API with a multi-level scrape approach:
1. Scrape each of the 10 parent category pages to extract subcategory links (e.g., `/73-cryogenic-service-valves`, `/77-general-service-valves`)
2. Scrape each subcategory page to extract product links (pattern: `/{series-slug}/{id}-{name}.html`)
3. Handle pagination on subcategory pages (e.g., "Showing 1-12 of 5305 items" means many pages)

## Bug 2: Every Product Page Scrape Times Out (BROKEN)

100% of scrape attempts on product pages fail with `SCRAPE_TIMEOUT`. I confirmed this — even my own fetch of a product page timed out. The site is heavy/slow to render.

**Fix**: Add `timeout: 60000` (60 seconds) to Firecrawl scrape requests, and simplify formats to just `['markdown']` (remove `json` extraction which adds processing time). The AI process step already handles content extraction.

## Bug 3: RS-Online Not Supported

The discovery function's `isProductUrl()` filter requires `.html` extension — RS-Online URLs don't use this pattern. RS-Online needs its own URL pattern detection.

**Fix**: Add RS-Online URL pattern support to the discovery function.

---

## Plan

### Step 1: Rewrite `product-discover-categories/index.ts`
Replace the broken Map API approach with a multi-level scrape strategy:
- Scrape each of the 10 parent category pages using Firecrawl Scrape with `formats: ['links']`
- Extract subcategory URLs (pattern: `/{number}-{slug}`)
- Scrape each subcategory page to extract product URLs
- Handle pagination: detect "page=2", "page=3" etc. links
- For RS-Online: extract product URLs matching their pattern (`/web/p/...` or similar)
- Insert all discovered product URLs as pending scrape jobs

### Step 2: Fix `product-scrape-batch/index.ts`
- Add `timeout: 60000` to Firecrawl scrape request
- Simplify formats to `['markdown', 'links']` (remove `json` — AI does extraction later)
- Add retry logic for timeout failures (retry once with `timeout: 90000`)

### Step 3: Update `ProductImport.tsx`
- Add the RS-Online URL to `SOURCE_CATEGORY_URLS`
- Increase discovery timeout handling in the UI

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/product-discover-categories/index.ts` | Replace Map API with multi-level scrape; add RS-Online support |
| `supabase/functions/product-scrape-batch/index.ts` | Add timeout: 60000, simplify formats, add retry for timeouts |
| `src/pages/admin/ProductImport.tsx` | Add RS-Online URL to source list |

## Expected Impact
- Discovery will find thousands of product URLs instead of 0
- Scraping will succeed with extended timeouts instead of 100% failure rate
- RS-Online products will be discoverable

## Cost Estimate
- Discovery: ~10 parent + ~100 subcategory scrape calls = ~110 Firecrawl credits
- Pagination discovery: ~500 additional calls for paginated subcategories
- Product scraping: 1 credit per product page
- Total discovery phase: ~600 credits (vs current 10 credits that find nothing)

