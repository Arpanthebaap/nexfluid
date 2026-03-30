

# Fix: Discovery Returns 0 Products

## Root Cause

The edge function logs tell the whole story:

```
MAP: https://www.valves-direct.com/6-pneumatic-cylinders (limit=5000)
MAP returned 1 URLs
Map found 0 products, 0 unique subcategories
```

Firecrawl's Map API is returning only **1 URL** (the category page itself) for valves-direct.com. The site likely blocks or doesn't expose its product URLs to the Map endpoint. But the code only falls back to scrape-based discovery when map returns **0 links** (`mapLinks.length > 0` on line 174). Since map returns 1 link, it thinks map worked — but found 0 products.

The scrape-based fallback (which was working before) never triggers.

## Fix

**File: `supabase/functions/product-discover-categories/index.ts`**

Change the fallback condition from "map returned 0 links" to "map found 0 products AND 0 subcategories". If map returns links but none match product or subcategory patterns, fall back to scrape-based discovery which actually loads the page and extracts real links.

Specifically:
1. After filtering map results for products and subcategories, check if both counts are 0
2. If so, trigger the scrape fallback instead of continuing with empty results
3. Add a log line making this decision visible

The change is roughly:
```
// Current (broken): only falls back if map returns literally 0 URLs
if (mapLinks.length > 0) { ... } else { /* scrape fallback */ }

// Fixed: fall back if map found no useful URLs
if (mapLinks.length > 0) {
  const products = mapLinks.filter(productFilter);
  const subcats = mapLinks.filter(subcatFilter);
  if (products.length === 0 && subcats.length === 0) {
    // Map returned generic links but no products — fall back to scrape
    console.log(`Map returned ${mapLinks.length} links but 0 products/subcats, falling back to scrape`);
    scrapeFallback = true;
    // ... run scrape-based discovery ...
  } else {
    // Map worked, continue with map results
  }
}
```

This is a single-file fix to `supabase/functions/product-discover-categories/index.ts`. The scrape fallback logic already exists and was working previously — it just needs to trigger when map returns useless results.

## Expected Result
- Discovery will detect that Map returned no product URLs and automatically use scrape-based discovery
- Products will be found and added to the pending queue again

