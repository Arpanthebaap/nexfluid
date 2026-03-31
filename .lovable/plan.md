

# Fix: Discovery Only Scrapes 504 of 3901 Pages

## Root Cause Analysis

Three issues prevent full page coverage:

### 1. Hard cap of 100 pages per subcategory (line 349)
```javascript
const pageLimit = Math.min(maxPage, 100);
```
Subcategories like `air-preparation-equipment-accessories` have 221+ pages. The cap cuts off more than half. With multiple such subcats, this accounts for thousands of missed pages.

### 2. Single empty page kills pagination (lines 361-363)
If one scrape returns 0 products (transient failure, timeout, Bad Gateway), pagination stops for that entire subcategory. Remaining pages are never scraped.

### 3. Parent category pagination not attempted for valves-direct
The parent URL (`6-pneumatic-cylinders`) itself may have paginated product listings. Currently only rs-online gets parent-page pagination. For valves-direct, only subcategories are paginated.

## Fix (single file)

**File: `supabase/functions/product-discover-categories/index.ts`**

1. **Increase page cap** from 100 to 500 per subcategory
2. **Add empty-page tolerance**: allow up to 3 consecutive empty pages before stopping (handles transient scrape failures)
3. **Add parent-page pagination for valves-direct**: after scraping subcategories from page 1, also check if the parent URL has `?page=` pagination and scrape those pages too (before entering subcategory loop)

These changes work within the existing resumable cursor system — the frontend loop already handles multiple calls correctly.

## Expected Result
- Subcategories with 200+ pages will be fully scraped (up to 500 pages each)
- Transient scrape failures won't prematurely stop pagination
- Parent category pages are also scraped for additional product URLs
- Discovery should reach 3000-3900+ pages across multiple resumable calls

