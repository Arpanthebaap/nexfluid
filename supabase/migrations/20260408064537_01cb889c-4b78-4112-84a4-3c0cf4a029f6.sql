
ALTER TABLE public.scrape_jobs ADD COLUMN IF NOT EXISTS source_link text;

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source_link ON public.scrape_jobs(source_link);

CREATE OR REPLACE FUNCTION public.get_source_link_stats()
RETURNS TABLE(
  source_link text,
  total bigint,
  pending bigint,
  scraped bigint,
  processed bigint,
  imported bigint,
  failed bigint,
  failed_brand bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sj.source_link,
    count(*)::bigint as total,
    count(*) FILTER (WHERE sj.status = 'pending')::bigint as pending,
    count(*) FILTER (WHERE sj.status = 'scraped')::bigint as scraped,
    count(*) FILTER (WHERE sj.status = 'processed')::bigint as processed,
    count(*) FILTER (WHERE sj.status = 'imported')::bigint as imported,
    count(*) FILTER (WHERE sj.status = 'failed' AND (sj.error_message NOT ILIKE '%brand%' AND sj.error_message NOT ILIKE '%pre-filter%' AND sj.error_message NOT ILIKE '%No scraped content%'))::bigint as failed,
    count(*) FILTER (WHERE sj.status = 'failed' AND (sj.error_message ILIKE '%brand%' OR sj.error_message ILIKE '%pre-filter%' OR sj.error_message ILIKE '%No scraped content%'))::bigint as failed_brand
  FROM public.scrape_jobs sj
  WHERE sj.source_link IS NOT NULL
  GROUP BY sj.source_link
  ORDER BY total DESC
$$;
