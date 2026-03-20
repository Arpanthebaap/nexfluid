

# Build the Automated Product Scraping & Import Pipeline

## Firecrawl Subscription Requirements

**You will need a paid Firecrawl plan.** Here's why:

- The free tier gives ~500 credits. Each scrape = 1 credit, each map = 1 credit.
- For ~85,000 products, you need at minimum ~85,000 scrape credits.
- **Recommendation**: Use coupon code **LOVABLE50** when signing up at firecrawl.dev — it gives **50% off the first 3 months** on the Standard plan or higher.
- The Standard plan ($45/mo with coupon) gives 50,000 credits/month — enough to do the import in 2 months.
- The Growth plan is better if you want it done faster.

**No other paid subscriptions are needed.** AI rewriting uses Lovable's built-in AI (Gemini) which is included. The database is on Lovable Cloud, also included.

## What We'll Build

A complete pipeline in the admin panel with 4 stages:

```text
[1. MAP] → [2. BATCH SCRAPE] → [3. AI PROCESS] → [4. INSERT]
   │              │                    │                │
   ▼              ▼                    ▼                ▼
 Discover      Extract raw        Rewrite to        Save to
 product       product data       unique content    products
 URLs          from pages         + translate IT    table
```

## Technical Implementation

### 1. Database: `scrape_jobs` table (new migration)
Track scraping progress with a jobs table:
- `id`, `source_url`, `status` (pending/scraped/processed/imported/failed)
- `raw_data` (JSON from Firecrawl), `processed_data` (AI output)
- `category_id` (mapped category), `error_message`, timestamps

### 2. Edge Function: `product-scrape-batch` (new)
- Accepts a batch of URLs (e.g., 10 at a time)
- Scrapes each using Firecrawl with JSON extraction format + schema for structured product data (name, code, brand, specs, images, description)
- Saves raw results to `scrape_jobs` table
- Returns progress

### 3. Edge Function: `product-ai-process` (new)
- Takes raw scraped data from `scrape_jobs`
- Calls Lovable AI (Gemini 2.5 Flash) to:
  - Rewrite description for 100% originality (English)
  - Translate to Italian
  - Generate SEO meta titles/descriptions in both languages
  - Match to existing category based on product name + specs
- Updates `scrape_jobs` with processed data

### 4. Edge Function: `product-bulk-insert` (new)
- Takes processed jobs and inserts into `products` table
- Generates slugs, sets product_code, links category_id
- Inserts technical_specs as JSON attributes into `product_attributes`
- Marks jobs as imported

### 5. Enhanced `ProductImport.tsx` (update)
Replace the basic test UI with a full pipeline dashboard:
- **Step 1 — Discover**: Map a source URL, filter to product pages only, save URLs to `scrape_jobs`
- **Step 2 — Scrape**: Start batch scraping with progress bar (10 URLs per batch, auto-continues)
- **Step 3 — Process**: Run AI processing on scraped data with progress tracking
- **Step 4 — Import**: Bulk insert processed products with summary stats
- Real-time progress counters: pending / scraped / processed / imported / failed
- Ability to pause/resume and retry failed items

### 6. Frontend API client update
Add methods for the new edge functions in `src/lib/api/firecrawl.ts`

## Files to create/modify

| File | Action |
|------|--------|
| `scrape_jobs` table | **Create** via migration |
| `supabase/functions/product-scrape-batch/index.ts` | **Create** — batch scrape with Firecrawl |
| `supabase/functions/product-ai-process/index.ts` | **Create** — AI rewrite + translate via Lovable AI |
| `supabase/functions/product-bulk-insert/index.ts` | **Create** — insert into products table |
| `src/lib/api/firecrawl.ts` | **Update** — add pipeline API methods |
| `src/pages/admin/ProductImport.tsx` | **Rewrite** — full pipeline dashboard with 4 steps |

## Execution Order
1. Create `scrape_jobs` table with migration
2. Build the 3 new edge functions
3. Update the API client
4. Rebuild the ProductImport admin page with the pipeline UI

