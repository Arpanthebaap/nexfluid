

# Discovery Fix + Manual URL Input

## Issues Found

### 1. Requeue "Bad Request" — batch too large
The logs show `Requeue error: { message: "Bad Request" }` repeatedly. The requeue step uses `.in('source_url', batch)` with up to 500 URLs. PostgREST has a URL/query size limit, and 500 long URLs exceeds it. This means failed URLs never get requeued.

### 2. Some categories return 0 links
Categories like `pinch-valves` and `seat-valves` return "Found 0 links on parent page" — Firecrawl is failing silently on those pages (likely getting blocked or timing out). No retry logic exists for parent page scraping.

### 3. Subcategory detection too restrictive
`isValvesDirectSubcategoryUrl` requires `segments.length !== 1` (exactly 1 path segment). Deeper nested subcategories (2+ segments) are missed entirely.

### 4. No way to add specific product URLs
User wants a section to paste individual product URLs directly into the pipeline.

## Plan

### Step 1: Fix `product-discover-categories/index.ts`
- Reduce requeue batch from 500 to 50 to avoid PostgREST "Bad Request"
- Add retry (1 attempt) for parent page scraping when it returns 0 links
- Relax `isValvesDirectSubcategoryUrl` to allow multi-segment subcategory paths (remove `segments.length !== 1` restriction, just check that path starts with `\d+-` pattern)

### Step 2: Add Manual URL Input to `ProductImport.tsx`
- Add a new Card section with a Textarea where user can paste specific product URLs (one per line)
- "Add to Pipeline" button that inserts them directly into `scrape_jobs` as `pending`
- Show count of new vs already-existing URLs after insertion
- Uses the same `firecrawlApi.discoverCategory` or direct Supabase insert

### Step 3: Add `addUrls` method to `firecrawl.ts`
- New edge function `product-add-urls` that accepts an array of URLs, inserts them into `scrape_jobs` with `pending` status, and returns counts of new/skipped/requeued

## Files to modify
| File | Change |
|------|--------|
| `supabase/functions/product-discover-categories/index.ts` | Reduce requeue batch to 50, add parent page retry, relax subcategory detection |
| `supabase/functions/product-add-urls/index.ts` | New edge function for manual URL insertion |
| `src/lib/api/firecrawl.ts` | Add `addUrls()` method |
| `src/pages/admin/ProductImport.tsx` | Add Manual URL Input card with textarea and button |
| `supabase/config.toml` | Add `product-add-urls` function config |

