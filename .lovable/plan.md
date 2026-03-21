

# Pipeline Readiness Assessment & Fixes

## Current State

- **Your paid Firecrawl key** (100K credits) is already connected and being used — confirmed via "Firecrawl.Arpan" connection
- **778 products** in DB (777 valid brands + 1 "Widget Co." to delete)
- **13,062 pending** scrape jobs, **78 failed**, **784 imported**
- Category assignment is mostly working: 547 products in correct leaf categories, but **231 stuck in "Directional Control Valves"** (a parent) and **21 with no category**

## Critical Issue: Discovery Will Timeout

The `product-discover-categories` function tries to process all 11 category URLs in **one edge function call**, scraping each parent page → all subcategories → all pagination pages. This means potentially **hundreds of Firecrawl API calls** in a single invocation. Supabase edge functions have a **60-second hard timeout** — the function will crash before finishing even 2 categories.

## Plan

### Step 1: Delete the remaining fake product
Delete the 1 "Widget Co." product still in the database.

### Step 2: Clear failed jobs + fix mismatched products
- Delete the 78 failed scrape jobs (most are hallucination rejects or timeouts from old code)
- Fix 231 products stuck in "Directional Control Valves" parent category — re-match them to leaf categories by extracting the slug from their `source_url`
- Fix 21 products with NULL category_id the same way

### Step 3: Rewrite discovery to process ONE category per call
Split the discovery function so it accepts a **single category URL** per invocation. The frontend `ProductImport.tsx` will call it in a loop — one category at a time — with progress updates between calls. This avoids the 60-second timeout.

Additionally, for categories with many subcategories, the function should limit itself to discovering subcategory URLs first, then return them. A second pass discovers product URLs from each subcategory. This two-pass approach keeps each call under 60 seconds.

### Step 4: Keep existing 13K pending jobs
The existing 13,062 pending jobs appear to be legitimate valves-direct product URLs (confirmed by sample check). They should stay — no need to re-discover them. The pipeline just needs to scrape → AI process → import them.

## Files to Modify

| File | Change |
|------|--------|
| Database | Delete Widget Co. product; delete 78 failed jobs; re-assign 252 mismatched products |
| `supabase/functions/product-discover-categories/index.ts` | Process ONE category URL per call; return partial results within 50s safety window |
| `src/pages/admin/ProductImport.tsx` | Loop through category URLs calling discovery one at a time; show per-category progress |

## After These Fixes

The pipeline will be ready to run. The existing 13K pending jobs will flow through scrape → AI → import. New discovery calls will find additional products from categories not yet covered. Each step respects the 60-second timeout.

