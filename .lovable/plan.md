

# Fix Discovery Accuracy: Source Tracking + Real Status Dashboard

## Root Cause Analysis

The discovery system has two problems causing the confusion:

1. **Inflated "New" counts**: The discovery function reports `totalNew` based on upsert results, but Firecrawl's map API returns duplicate URLs across pages and subcategories. Additionally, re-queued failed jobs get counted alongside genuinely new ones. The "16,513 new" likely includes thousands of duplicate URLs that passed dedup in the DB but were counted multiple times across resumable calls.

2. **No per-source tracking**: Once URLs enter `scrape_jobs`, there's no way to trace which source link they came from. So you can't answer "how many products from solenoid-valves are pending vs failed vs imported?"

3. **Failed jobs include brand-rejected URLs**: The scraper rejects non-whitelisted brands at scrape time, marking them "failed". These inflate the failure count even though they're working as intended.

## Solution

### 1. Add `source_link` column to `scrape_jobs` table
Track which discovery source each job came from, so we can query status breakdowns per source.

**Migration:**
- `ALTER TABLE scrape_jobs ADD COLUMN source_link text;`
- Update discovery function to set `source_link` when inserting jobs

### 2. Create `get_source_link_stats` RPC function
A database function that returns per-source-link aggregated counts:
```
source_link | total | pending | scraping | scraped | failed_brand | failed_other | imported
```
This gives an instant, accurate view of pipeline progress per source.

### 3. Update discovery function to set `source_link`
When upserting into `scrape_jobs`, include `source_link: categoryUrl` so every job is traceable to its origin.

### 4. Update discovery function to report accurate counts
- Query the DB after upsert to get the **actual** count of pending jobs for this source
- Separate "brand-rejected" failures from real failures in the response
- Return `actualPending` alongside `totalFound` and `totalNew`

### 5. Add per-source status breakdown to admin import page
On the source links management section, show a mini dashboard per source:
- Total jobs | Pending | Failed (real) | Failed (brand) | Imported
- This replaces the current confusing "Found: X / New: Y" display

### 6. Add a "Clean up permanently failed" button
Allow admin to delete jobs that failed with permanent errors (brand-rejected, no-content) to keep counts clean and the queue focused on real work.

## Technical Details

The `get_source_link_stats` RPC:
```sql
CREATE OR REPLACE FUNCTION get_source_link_stats()
RETURNS TABLE(
  source_link text,
  total bigint,
  pending bigint,
  scraping bigint,
  scraped bigint,
  ai_processing bigint,
  ai_processed bigint,
  imported bigint,
  failed bigint,
  failed_brand bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT 
    source_link,
    count(*)::bigint as total,
    count(*) FILTER (WHERE status = 'pending')::bigint,
    count(*) FILTER (WHERE status = 'scraping')::bigint,
    count(*) FILTER (WHERE status = 'scraped')::bigint,
    count(*) FILTER (WHERE status = 'ai_processing')::bigint,
    count(*) FILTER (WHERE status = 'ai_processed')::bigint,
    count(*) FILTER (WHERE status = 'imported')::bigint,
    count(*) FILTER (WHERE status = 'failed' AND (error_message NOT ILIKE '%brand%' AND error_message NOT ILIKE '%pre-filter%'))::bigint,
    count(*) FILTER (WHERE status = 'failed' AND (error_message ILIKE '%brand%' OR error_message ILIKE '%pre-filter%'))::bigint
  FROM scrape_jobs
  WHERE source_link IS NOT NULL
  GROUP BY source_link
  ORDER BY total DESC
$$;
```

## Files to modify

| File | Change |
|------|--------|
| New migration | Add `source_link` column + `get_source_link_stats` RPC |
| `supabase/functions/product-discover-categories/index.ts` | Set `source_link` on upsert, return accurate counts |
| Admin import page (source links section) | Show per-source status breakdown table |

