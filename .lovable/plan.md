

# Fix: Single Source Link Discovery Fails for rs-online.com

## Root Cause

The discovery function has **two separate bugs** affecting rs-online URLs:

### Bug 1: No subcategory or pagination handling for rs-online
When `isRsOnline = true` (line 197), subcategory detection is completely skipped:
```javascript
if (!isRsOnline) {
  // subcategory discovery only runs for valves-direct
}
```
This means the pagination loop (lines 246-319) never executes because `subcatUrls` stays empty. The function only returns whatever products appear on the single parent page scrape.

### Bug 2: rs-online uses different pagination parameters
rs-online uses `?pn=2` or `&pn=2` for pagination, but `extractMaxPage()` only checks for `?page=`. Even if pagination links are found, they won't be detected.

### Result
For `https://it.rs-online.com/web/b/parker/`: Map returns ~19 product URLs from page 1, no subcategories are discovered, no pagination is attempted. Discovery reports "Found: 19, New: 0" (all 19 already exist).

## Fix

### File: `supabase/functions/product-discover-categories/index.ts`

**1. Update `extractMaxPage` to handle rs-online pagination**
Add detection for `pn=` parameter alongside `page=`:
```
const pagePatterns = [/[?&]page=(\d+)/, /[?&]pn=(\d+)/];
```

**2. Add parent-page pagination for rs-online**
After the scrape fallback finds products on the parent page, check those links for pagination and scrape subsequent pages. Currently only valves-direct subcategories get paginated — rs-online parent pages need the same treatment:

```
// After scraping parent page for rs-online:
if (isRsOnline && directProducts.length > 0) {
  const maxPage = extractMaxPage(parentLinks);
  for (let p = 2; p <= Math.min(maxPage, 200); p++) {
    if (!isTimeSafe()) { timedOut = true; break; }
    const pageUrl = `${categoryUrl}?pn=${p}`;
    const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
    const pageProducts = pageLinks.filter(productFilter && !shouldExclude);
    if (pageProducts.length === 0) break;
    allProductUrls.push(...pageProducts);
  }
}
```

**3. Support resumable pagination for rs-online parent pages**
Since rs-online doesn't have subcategories, treat the parent page itself as "subcat 0" for resume purposes. When the timer runs out mid-pagination, return `resumeFrom` with the current page so the frontend loop can continue.

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/product-discover-categories/index.ts` | Add `pn=` to `extractMaxPage`, add parent-page pagination for rs-online with resume support |

## Expected Result
- rs-online brand pages with hundreds of paginated pages will be fully scraped across multiple resumable calls
- `https://it.rs-online.com/web/b/parker/` will discover all Parker products instead of just 19

