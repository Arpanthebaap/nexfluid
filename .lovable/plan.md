

# Test the Product Scraping Pipeline End-to-End

Firecrawl is already connected and configured. No additional API key setup is needed. The next step is to verify the full pipeline works with a small test batch.

## What we'll do

1. **Log into admin panel** and navigate to the Product Import page
2. **Map valves-direct.com** to discover product URLs
3. **Save 5-10 product URLs** as scrape jobs
4. **Run batch scrape** on those URLs to extract product data
5. **Run AI processing** to rewrite descriptions and translate to Italian
6. **Run bulk insert** to import the processed products into the database

## Before testing, two improvements needed

### Fix: `product-ai-process` edge function
The current function calls Lovable AI gateway but needs the correct endpoint URL format. Need to verify the gateway URL and model identifier are correct.

### Fix: `product-bulk-insert` edge function  
Need to verify it correctly maps to the existing `products` table schema (columns, required fields, slug generation).

## Steps

1. Review and fix the 3 pipeline edge functions to ensure they work with the actual database schema
2. Test by navigating to `/admin/import` in the preview
3. Run through all 4 pipeline stages with a small batch

## Files to review/update
- `supabase/functions/product-scrape-batch/index.ts` — verify scrape schema
- `supabase/functions/product-ai-process/index.ts` — verify AI gateway call
- `supabase/functions/product-bulk-insert/index.ts` — verify products table mapping
- `src/pages/admin/ProductImport.tsx` — ensure UI handles all responses correctly

