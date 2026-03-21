

# Add 3 Standalone Auto-Loop Buttons

## Rationale

This is a great idea. The full pipeline runs all 4 phases (discover + scrape + AI + import) together, but often you have jobs stuck at one stage and just want to drain that queue independently. Three dedicated buttons let you:
- **Scrape All Pending**: runs the scrape loop until all pending jobs are scraped
- **Process All Scraped**: runs the AI loop until all scraped jobs are processed  
- **Import All Processed**: runs the import loop until all processed jobs are imported

Each button runs its respective loop (reusing the existing `runScrapeLoop`, `runAiLoop`, `runInsertLoop` logic) independently, with its own stop capability.

## Changes

### `src/pages/admin/ProductImport.tsx`

Add 3 new state trackers for which individual loop is running (`scraping`, `processing`, `importing`), then add 3 buttons next to "Start Full Pipeline":

- **"Scrape All" button** (Globe icon) — visible when `counts.pending > 0` and pipeline is idle. Runs `runScrapeLoop()` standalone, shows count badge, stoppable.
- **"Process All" button** (Cpu icon) — visible when `counts.scraped > 0` and pipeline is idle. Runs `runAiLoop()` standalone (without the initial 10s delay), stoppable.
- **"Import All" button** (Database icon) — visible when `counts.processed > 0` and pipeline is idle. Runs `runInsertLoop()` standalone (without the initial 20s delay), stoppable.

Each button toggles between "Start" and "Stop" state. The `stopRef` is shared so stopping any individual loop or the full pipeline stops everything. The `isRunning` check prevents running multiple things simultaneously.

Refactor `runAiLoop` and `runInsertLoop` to accept an optional `skipDelay` parameter so they skip the initial wait when run standalone.

### Button layout

```text
[ Start Full Pipeline ]  [ Scrape All (13K) ]  [ Process All (5) ]  [ Import All (12) ]
```

Buttons are disabled when their queue is empty or another operation is running. Each shows the current count as a badge.

## No other files change

This is a UI-only change to `ProductImport.tsx`. The existing loop functions and edge functions stay the same.

