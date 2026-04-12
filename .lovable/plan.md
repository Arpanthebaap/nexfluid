

# Fix AI Processing Pipeline Failures

## Root Cause

Two distinct issues are causing the "all failing" behavior:

### 1. "Access Denied" pages waste AI credits and fail
2,252 of the 25,430 scraped jobs contain "Access Denied" error pages (from RS Online blocking the scraper). These pages pass the content validation check (>50 chars) and get sent to the AI gateway, which costs credits. The AI can't extract a brand from "Access Denied" text, so `normalizeBrand("")` returns null and the job is marked failed with `invalid brand ""`.

### 2. Pages without any allowed brand in content fail after AI processing
Even when AI processing succeeds, if neither the content nor the AI response contains a recognized brand (PARKER, ASCO, AVENTICS, etc.), the job fails at line 437. Many valves-direct.com product pages may not explicitly mention the brand name.

## Solution

### A. Add "Access Denied" / error page detection before AI call
In `product-ai-process/index.ts`, add a check right after extracting the markdown. If the content matches known error patterns ("Access Denied", "403 Forbidden", "Page not found", etc.), mark the job as failed immediately without calling the AI.

### B. Infer brand from source URL when content lacks it
valves-direct.com products are multi-brand. But when the AI and content extraction both return empty brand, we should try to infer from the source_link (parent category). Add a fallback: if brand is empty after AI processing, check the `source_link` field or known URL patterns to assign a default brand or mark as "needs-review" instead of hard-failing.

### C. Bulk-reject "Access Denied" scraped jobs in one SQL update
Before processing the batch, run a single UPDATE to mark all scraped jobs with "Access Denied" content as failed. This clears 2,252 jobs from the queue instantly.

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/product-ai-process/index.ts` | Add error page detection before AI call; add brand inference fallback from source URL |

## Technical Details

**Error page detection (before AI call, around line 292):**
```typescript
const ERROR_PAGE_PATTERNS = ['Access Denied', '403 Forbidden', 'Page not found', '404 Not Found', 'Error 503'];
const isErrorPage = ERROR_PAGE_PATTERNS.some(p => rawMarkdown.includes(p)) && rawMarkdown.length < 500;
if (isErrorPage) {
  // Mark failed, skip AI call
}
```

**Brand fallback (around line 435):**
When brand is empty after AI processing, check if the page is from valves-direct.com. Since valves-direct sells multiple brands, keep the AI-returned brand but also accept the job if it has a valid product code and meaningful content -- mark brand as the one detected by the AI even if not in the allowed list, or set a "GENERIC" fallback to avoid losing valid products.

Actually, the better approach: bulk-reject the Access Denied pages (the main culprit), and for the remaining jobs, the brand check is working correctly -- products without an identifiable allowed brand should indeed be skipped.

