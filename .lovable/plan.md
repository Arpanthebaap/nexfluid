

# Fix: Pipeline Stuck — Scrape Loop Breaks Early + Queue Clogged

## What's Actually Happening (from live data)

**Current state**: 507 pending, 0 scraped, 0 processed, 11,445 imported, 200 failed

**Breakdown of 507 pending URLs by brand:**
- ASCO: 50, AVENTICS: 213, JOUCOMATIC: 34, NUMATICS: 23 — **320 valid, processable**
- Burkert: 42, Camozzi: 85, Pneumax: 33 — **160 will always be rejected by URL pre-filter**
- Other: 27

**Bug #1: Scrape loop quits after 5 batches even though valid URLs exist**

The scrape loop (`runScrapeLoop`) checks `if (data.scraped === 0)` to count "empty rounds" and breaks after 5. But when `product-scrape-batch` returns `{"scraped":0, "failed":2, "skippedBrand":2}`, that counts as an empty round even though pending jobs existed — they were just rejected brands. The loop breaks after 5 consecutive brand-rejection batches without ever reaching the 320 valid ASCO/AVENTICS/JOUCOMATIC/NUMATICS URLs.

**Bug #2: No query ordering — rejected brands always get picked first**

`product-scrape-batch` queries `WHERE status='pending' LIMIT 2` with no `ORDER BY`. The database returns rows in arbitrary order, and the rejected-brand URLs keep getting selected first.

**Bug #3: Discovery returns 0 new because all URLs exist**

The `upsert` with `ignoreDuplicates: true` silently skips all URLs that already exist in `scrape_jobs`. Since the site hasn't added new products, discovery reports "0 new, 0 requeued" — there's nothing new to find. The 320 valid pending URLs are already queued; they just can't process due to bugs #1 and #2.

**About the "vanished 34K products"**: The products table has 11,426 products. The scrape_jobs table has 12,152 entries. It appears the scrape_jobs table was cleared at some point (possibly via "Clear All Jobs"), losing tracking of ~22K previously processed URLs. The products themselves may still be in the products table if they weren't deleted.

## Fix Plan

### Step 1: Fix scrape loop empty-round detection (`ProductImport.tsx`)
Change the loop to only count a round as "empty" when the total batch was 0 (no pending jobs at all), not when all jobs were brand-skipped:
```
// Before (broken):
if (data.scraped === 0) { emptyRounds++; ... }

// After (fixed):
if (data.total === 0) { emptyRounds++; ... }
```
This way, brand-rejection batches keep the loop running until it reaches valid URLs.

### Step 2: Add ordering to scrape-batch query (`product-scrape-batch/index.ts`)
Add `.order('source_url', { ascending: true })` to the pending jobs query. This ensures alphabetical processing, which naturally groups ASCO/AVENTICS URLs before burkert/camozzi/pneumax, processing valid products first.

### Step 3: Bulk-reject pending rejected-brand URLs upfront (`product-scrape-batch/index.ts`)
Before processing the batch, run a quick bulk update to mark all pending jobs with rejected-brand URLs as failed in one go, instead of wasting API calls:
```sql
UPDATE scrape_jobs SET status='failed', error_message='URL pre-filter: non-whitelisted brand'
WHERE status='pending' AND (source_url ILIKE '%burkert%' OR source_url ILIKE '%camozzi%' OR ...)
```
This clears the 160 clogging URLs immediately on the next scrape call.

### Step 4: Fix discovery to requeue "imported" URLs that match pending criteria
Add an option to the discovery function to reset imported URLs back to pending when the user explicitly runs "Force Discovery". This handles the case where URLs exist but need re-processing.

## Files to modify

| File | Change |
|------|--------|
| `src/pages/admin/ProductImport.tsx` | Fix empty-round detection in `runScrapeLoop` to check `data.total === 0` instead of `data.scraped === 0` |
| `supabase/functions/product-scrape-batch/index.ts` | Add `.order('source_url')` to query; add bulk-reject of known-bad brand URLs at start of function |

## Expected Result
- The 320 valid pending URLs (ASCO, AVENTICS, JOUCOMATIC, NUMATICS) will be scraped immediately
- Brand-rejected URLs get cleared in bulk instead of one-by-one
- Scrape loop no longer quits prematurely
- Pipeline processes the existing backlog without needing new discovery

