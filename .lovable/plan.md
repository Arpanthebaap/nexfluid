
Goal
Stabilize the full and standalone import pipeline so valid products stop failing, duplicates stop accumulating, and reruns become safe/idempotent.

What I found (from code + live data)
1) False brand rejections in AI stage:
- `product-ai-process` rejects by substring (`MAC`, `UNIVER`, `ROSS`) against full markdown text.
- This is causing valid ASCO/AVENTICS/SIRAI products to be marked failed.

2) Massive duplicate job creation:
- `product-discover-categories` tries to dedupe by reading existing URLs, but the query only effectively covers a limited slice.
- No unique constraint on `scrape_jobs.source_url`, so repeated discovery keeps inserting the same URLs (many with 50+ duplicates).

3) Import stage is not idempotent:
- `product-bulk-insert` does plain insert into `products`.
- Existing `product_code` conflicts are treated as failures, so reruns push many records to failed.

4) Full pipeline orchestration can worsen backlog:
- “Start Full Pipeline” always runs discovery first, even when there is already a huge pending queue.
- This amplifies duplicate risk and workload.

Implementation plan
Step 1 — Database hardening migration
- Deduplicate existing `scrape_jobs` by `source_url` (keep best/latest row, delete the rest).
- Add unique index/constraint on `scrape_jobs.source_url`.
- Keep existing RLS/policies unchanged.

Step 2 — Discovery function fix (`product-discover-categories`)
- Remove full-table “existing URLs” prefetch.
- Insert discovered URLs via upsert on `source_url` with ignore-duplicates behavior.
- Move timeout start timestamp inside request scope (not module scope) for safe per-run timing.

Step 3 — AI processing brand filter fix (`product-ai-process`)
- Replace loose substring matching with strict token/word-boundary matching.
- Remove/handle ambiguous short tokens (`MAC`, `ROSS`, `UNIVER`) with safer rules.
- Prefer explicit brand signals from URL/title before rejecting.
- Keep credit-saving prefilter, but reduce false positives.

Step 4 — Import function idempotency (`product-bulk-insert`)
- Convert product insert to upsert by `product_code` (update existing product fields on conflict).
- For attributes: clear-and-replace (or dedupe) for the target product to avoid duplicates on rerun.
- Mark job as imported after successful upsert instead of failed-on-duplicate.

Step 5 — Admin pipeline behavior (`ProductImport.tsx`)
- If pending jobs already exist, skip discovery by default in “Start Full Pipeline”.
- Add explicit “Force Discovery” action for when you intentionally want new URL discovery.
- Keep standalone actions, but adjust loop stop conditions to avoid unnecessary import retries when no processed items exist.

Step 6 — Recovery of wrongly failed jobs
- Requeue only false-failed rows from recent bad filter patterns (e.g., MAC/UNIVER/ROSS false positives and duplicate-insert failures).
- Do not requeue true blocked brands (camozzi, burkert, etc.).
- Resume pipeline.

Step 7 — Verification checklist (full + standalone)
- Standalone Scrape: pending decreases, scraped increases.
- Standalone Process: scraped decreases, processed increases, false brand failures near zero.
- Standalone Import: processed decreases, imported increases, duplicate-key failures zero.
- Full Pipeline: all three stages advance continuously; no duplicate job explosion.
- Confirm failure reasons are mostly genuine source/brand exclusions.

Technical details
- Files to update:
  - `supabase/functions/product-discover-categories/index.ts`
  - `supabase/functions/product-ai-process/index.ts`
  - `supabase/functions/product-bulk-insert/index.ts`
  - `src/pages/admin/ProductImport.tsx`
  - new DB migration in `supabase/migrations/*`
- Primary root-cause fixes:
  - enforce unique URL jobs at DB level
  - safer brand detection logic
  - idempotent import by `product_code`
  - avoid unnecessary rediscovery while backlog exists

Expected outcome
- Failure rate drops significantly for valid products.
- Pipeline can be safely resumed/restarted without creating duplicate jobs or duplicate-key failures.
- Full pipeline and standalone modes both become predictable and stable again.
