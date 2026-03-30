

# Pipeline Discovery Bug: URLs Not Appearing in Pending

## Root Cause

The `product-discover-categories` function uses `upsert` with `ignoreDuplicates: true` (ON CONFLICT DO NOTHING). Since all 11,796 previously discovered URLs already exist in `scrape_jobs` (as `imported` or `failed`), the upsert silently skips every URL. No new rows are created.

Additionally, the `totalNew` count reported back to the UI is **wrong** -- it uses `batch.length` (line 224) instead of the actual number of inserted rows. So the UI says "Found X new URLs" when in reality 0 were inserted.

## What Needs to Change

### 1. Fix inaccurate count reporting (`product-discover-categories/index.ts`)
Replace `inserted += batch.length` with actual count from the response. Use `.select('id')` result length or a count-based approach to determine how many rows were truly new.

### 2. Discovery should not re-queue already-imported URLs
The current behavior (skip duplicates) is correct for `imported` URLs -- we don't want to re-process products that are already in the products table.

### 3. Discovery should optionally re-queue failed URLs
When discovery finds URLs that previously failed, those should be reset to `pending` so they get another chance. This requires changing the upsert to: insert new URLs with `ignoreDuplicates`, then separately UPDATE existing `failed` rows back to `pending` if their `source_url` is in the discovered set.

### 4. UI should show accurate feedback
The admin UI log currently says things like "Found 500 products, 500 new" when actually 0 are new. Fix to show "Found 500 products, 0 new (all previously discovered)".

## Implementation

**File: `supabase/functions/product-discover-categories/index.ts`**
- After the upsert with `ignoreDuplicates`, count actual new inserts by checking the returned `data` array length (not `batch.length`)
- Add a second step: `UPDATE scrape_jobs SET status = 'pending', error_message = null WHERE source_url IN (...) AND status = 'failed'` to re-queue failed URLs
- Return both `totalNew` (truly new) and `totalRequeued` (failed -> pending) in the response

**File: `src/pages/admin/ProductImport.tsx`**
- Update the discovery log line to show requeued count: "Found X products, Y new, Z requeued from failed"

## Technical Detail

The upsert with `.select('id')` and `ignoreDuplicates: true` returns only the rows that were actually inserted (not the skipped ones). So switching from `inserted += batch.length` to `inserted += (data?.length || 0)` gives the correct count. For re-queuing failed URLs, batch them in groups and run an update query.

