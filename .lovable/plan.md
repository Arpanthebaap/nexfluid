

# Full Pipeline Automation Plan

## Current State Assessment

Your project is in solid shape for Phase 3 (Scraping Pipeline):
- **501 categories** already in the database
- **1 product** successfully imported end-to-end (pipeline proven working)
- **4 edge functions** deployed and functional (discover, scrape, AI process, bulk insert)
- **Admin panel** working with login fixed
- **Firecrawl** connected with ~100K credits available

The pipeline works — it just needs to be run at scale with a simpler UX.

## What I'll Build

### 1. One-Click "Run Full Pipeline" Button
Replace the current 4-step manual process with a single button that chains everything automatically:
- **Step 1**: Discover product URLs from all 11 category pages (uses ~11 Firecrawl credits)
- **Step 2**: Auto-start batch scraping all discovered URLs (5 per batch, auto-continues)
- **Step 3**: Auto-start AI rewriting as scraped jobs become available (3 per batch)
- **Step 4**: Auto-start importing as processed jobs become available (10 per batch)

Steps 2-4 will run in parallel where possible — as soon as scraped jobs appear, AI processing starts; as soon as processed jobs appear, import starts.

### 2. Simplified Import Page
- Large progress display showing overall pipeline state
- Real-time counts updating every 3 seconds
- Estimated time remaining based on processing speed
- Single "Start Pipeline" / "Stop Pipeline" toggle
- Keep individual step controls collapsed under an "Advanced" section for manual control
- Add a "Clear All Jobs" button to reset for fresh runs

### 3. Deploy All Edge Functions
Ensure all 4 pipeline functions plus the map function are deployed and ready.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/ProductImport.tsx` | Rewrite with one-click automation, parallel pipeline, progress display |
| `src/components/admin/CategoryDiscovery.tsx` | Integrate into the automated flow (callable programmatically) |

## How It Will Work

```text
User clicks "Start Full Pipeline"
  → Discovery runs (11 category URLs mapped via Firecrawl)
  → ~5,000-15,000 product URLs saved as pending jobs
  → Scrape loop starts automatically (5/batch, ~500ms delay)
  → AI loop starts in parallel once first scraped jobs appear
  → Import loop starts in parallel once first processed jobs appear
  → Progress bar shows: X of Y products imported
  → User can stop anytime, resume later
```

## Cost Estimate
- Discovery: ~11 credits (map calls)
- Scraping: 1 credit per product URL (~5K-15K credits)
- AI processing: uses Lovable AI (no Firecrawl credits)
- Total Firecrawl: ~5K-15K credits (well within your 100K budget)

## Important Notes
- Each edge function has a ~60s timeout, so batch sizes stay small (5 scrape, 3 AI, 10 import)
- The UI loops continuously, calling the edge function repeatedly
- If you close the browser, processing stops — you can resume by clicking Start again
- All progress is saved in `scrape_jobs` table, so nothing is lost

