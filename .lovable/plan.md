

# Pipeline Stability Fix

## Issues Found

### 1. AI processing times out after 3 products
The `product-ai-process` edge function has **no safety timer** (unlike `product-scrape-batch` which has a 120s one). Processing 3 products sequentially (each AI call ~10s + 1s delay) can exceed the client connection timeout, causing "Failed to send a request to the Edge Function". The edge function keeps running but the client gets an error.

### 2. "Start Full Pipeline" doesn't route to the right backlog stage
Currently it skips discovery if backlog exists but always starts all 3 parallel loops (scrape + AI + import). If only "processed" items exist, it still starts the scrape loop unnecessarily — wasting rounds and confusing logs.

### 3. AI loop breaks on transient errors instead of retrying
In `runAiLoop`, when the error is "Failed to send a request", the loop `break`s entirely. This should retry a few times since the edge function likely succeeded but the response was lost.

## Plan

### Step 1: Add safety timer to `product-ai-process/index.ts`
Add a 90-second safety window (similar to scrape-batch's 120s). Return partial results if approaching timeout. Reduce default batch from 5 to 2 so each invocation completes faster.

### Step 2: Update `ProductImport.tsx` — smart backlog routing
Modify `runFullPipeline` to only start the loops that have work:
- If `processed > 0` → start import loop
- If `scraped > 0` → start AI + import loops  
- If `pending > 0` → start all 3 loops
- Skip loops that have no backlog (no empty round spinning)

### Step 3: Make `runAiLoop` resilient to transient failures
Instead of `break` on generic errors, retry up to 3 times with backoff. Only break on definitive errors (402 credits exhausted).

### Step 4: Reduce AI batch size
Change `runAiLoop` call from `firecrawlApi.aiProcess(3)` to `firecrawlApi.aiProcess(2)` to stay well within timeout.

## Files to modify
| File | Change |
|------|--------|
| `supabase/functions/product-ai-process/index.ts` | Add 90s safety timer, reduce default batch to 2 |
| `src/pages/admin/ProductImport.tsx` | Smart backlog routing in `runFullPipeline`, retry logic in `runAiLoop`, batch size reduction |

