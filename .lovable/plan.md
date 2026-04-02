

# Delete All 15,063 Failed Jobs

## What to do

Run a single SQL DELETE via the insert tool to remove all failed jobs from the `scrape_jobs` table.

```sql
DELETE FROM scrape_jobs WHERE status = 'failed';
```

This is a data operation (not a schema change), so it uses the insert tool.

## Expected Result
- 15,063 rows removed
- Dashboard shows 0 failed jobs
- Pipeline runs cleaner without recycling dead URLs

## Files to modify
None — this is a database-only operation.

