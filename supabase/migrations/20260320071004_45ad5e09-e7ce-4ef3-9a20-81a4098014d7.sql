
CREATE TYPE public.scrape_status AS ENUM ('pending', 'scraped', 'processed', 'imported', 'failed');

CREATE TABLE public.scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  status scrape_status NOT NULL DEFAULT 'pending',
  raw_data jsonb,
  processed_data jsonb,
  category_id uuid REFERENCES public.categories(id),
  error_message text,
  batch_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scrape jobs" ON public.scrape_jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_scrape_jobs_status ON public.scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_batch_id ON public.scrape_jobs(batch_id);
