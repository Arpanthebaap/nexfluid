-- Step 1: Deduplicate scrape_jobs by source_url (keep the row with best status priority)
DELETE FROM public.scrape_jobs
WHERE id NOT IN (
  SELECT DISTINCT ON (source_url) id
  FROM public.scrape_jobs
  ORDER BY source_url,
    CASE status
      WHEN 'imported' THEN 1
      WHEN 'processed' THEN 2
      WHEN 'scraped' THEN 3
      WHEN 'pending' THEN 4
      WHEN 'failed' THEN 5
    END,
    updated_at DESC
);

-- Step 2: Add unique index on source_url to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_scrape_jobs_source_url_unique ON public.scrape_jobs (source_url);

-- Step 3: Add unique constraint on products.product_code for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_code_unique ON public.products (product_code);