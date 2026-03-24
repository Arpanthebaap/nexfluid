CREATE OR REPLACE FUNCTION public.get_scrape_job_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'pending', COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
    'scraped', COALESCE(SUM(CASE WHEN status = 'scraped' THEN 1 ELSE 0 END), 0),
    'processed', COALESCE(SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END), 0),
    'imported', COALESCE(SUM(CASE WHEN status = 'imported' THEN 1 ELSE 0 END), 0),
    'failed', COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0)
  )
  FROM public.scrape_jobs
$$;