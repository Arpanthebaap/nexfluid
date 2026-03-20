

# Scrape Products from Valves Direct & RS-Online

The pipeline is already built. Here's what needs to happen to scrape your specific category pages.

## Approach

These URLs are **category pages**, not individual product pages. We need to:

1. **Map each category URL** to discover individual product page URLs within it
2. **Filter** to keep only product pages (not navigation, footer links, etc.)
3. **Save as scrape jobs**, then run the existing 3-stage pipeline (Scrape → AI Process → Import)

## What I'll Build

### 1. Enhanced ProductImport page — "Bulk Category Import" mode
Add a new section to the import page where you can paste multiple category URLs at once. For each URL, the system will:
- Call the Firecrawl Map API to discover all product links under that category
- Auto-filter to product-pattern URLs (e.g. URLs containing `/product/` or item-level patterns)
- Aggregate all discovered product URLs and save them as scrape jobs in one click

### 2. New edge function: `product-discover-categories`
A backend function that takes a list of category URLs, maps each one via Firecrawl, and inserts all discovered product URLs directly into `scrape_jobs` as pending jobs. This avoids manually mapping each URL one by one from the UI.

Key logic:
- For **valves-direct.com**: Map each of the 10 category URLs, filter for product-level pages
- For **rs-online.com**: Map the Parker brand page, filter for product pages
- Deduplicate URLs already in `scrape_jobs`
- Return count of new jobs created per source

### 3. Pre-loaded source URLs
Hard-code the 11 URLs you provided as presets in the import UI, so you can launch discovery with one click.

## Files to create/modify

| File | Action |
|------|--------|
| `supabase/functions/product-discover-categories/index.ts` | **Create** — bulk map categories → save product URLs |
| `src/pages/admin/ProductImport.tsx` | **Update** — add bulk category discovery UI with preset URLs |
| `src/lib/api/firecrawl.ts` | **Update** — add `discoverCategories` method |

## How it works end-to-end

```text
You click "Discover All" 
  → Edge function maps all 11 category URLs via Firecrawl
  → Filters to product-level URLs only
  → Deduplicates against existing scrape_jobs
  → Inserts as pending jobs
  → You then run Scrape → AI Process → Import as before
```

## Important notes

- Each Map call costs 1 Firecrawl credit (11 total for discovery)
- The actual scraping will cost 1 credit per product URL found
- RS-Online may have pagination — the map function handles up to 5,000 URLs per domain
- Discovery runs server-side to avoid timeouts

