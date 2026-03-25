

# Pipeline Analysis & Optimization Plan

## Current Status (from live data)
- **Pending**: 25,124 | **Scraped**: 321 | **Processed**: 218 | **Imported**: 4,728 | **Failed**: 627
- AI processing is failing ~66% of the time (typically processed 1 out of 3 per batch)

## Issues Found

### Issue 1: Raw data structure mismatch (BUG)
The scrape function saves data as `{ markdown, links, metadata }`, but the AI process function reads `job.raw_data?.json` -- which is always `undefined`. This means the AI never gets structured product data (name, brand, specs) and has to extract everything from markdown alone, causing many "no meaningful scraped content" failures.

**Fix**: Update `product-scrape-batch` to also request JSON extraction from Firecrawl, or update `product-ai-process` to properly parse from markdown/metadata.

### Issue 2: Non-whitelisted brands waste AI credits
The logs show most failures are brand rejections (Burkert, Pneumax, Mindman, Camozzi, Deltrol). These products get scraped, sent to AI for processing (consuming credits), and only THEN rejected. The brand check should happen earlier -- ideally before AI processing or even before scraping.

**Fix**: Add a pre-filter in `product-ai-process` that checks brand from the scraped markdown/metadata BEFORE calling the AI. If the brand is clearly non-whitelisted, skip it immediately.

### Issue 3: Sequential vs Parallel Pipeline
Your current parallel approach (scrape + AI + import running simultaneously) is actually the **correct design** for 85k products. A sequential 1-by-1 approach would be extremely slow because:
- Scraping takes ~2-5 seconds per product
- AI processing takes ~3-8 seconds per product  
- Import is fast (~100ms)
- Sequential: ~10 seconds per product = ~70 hours for 25k remaining
- Parallel: processes all 3 stages concurrently, ~3x faster

**Recommendation**: Keep parallel, but fix the bugs causing failures.

## Plan

### Step 1: Fix raw data parsing in AI process
Update `product-ai-process/index.ts` to extract product name, brand, and specs from `raw_data.markdown` and `raw_data.metadata` instead of the nonexistent `raw_data.json`.

### Step 2: Add early brand filtering before AI call
In `product-ai-process/index.ts`, detect brand from scraped markdown/metadata text BEFORE sending to AI. If it matches a known non-whitelisted brand, mark as failed immediately without consuming AI credits.

### Step 3: Add early brand filtering in scrape batch (optional)
In `product-scrape-batch/index.ts`, check the source URL for obvious non-whitelisted brand indicators (e.g., URL contains "burkert", "pneumax") and skip scraping entirely.

### Technical Details

| File | Change |
|------|--------|
| `supabase/functions/product-ai-process/index.ts` | Fix `raw_data.json` to parse from `raw_data.markdown` + `raw_data.metadata`; add pre-AI brand detection |
| `supabase/functions/product-scrape-batch/index.ts` | Add optional URL-based brand pre-filter |

### Expected Impact
- Eliminate ~50-60% of AI failures (brand rejections caught early)
- Eliminate "no meaningful content" failures from bad data parsing
- Save significant AI credits
- Pipeline speed stays the same (parallel)

