ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS mirror_status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_products_mirror_status
  ON public.products (mirror_status)
  WHERE mirror_status = 'pending';

-- Mark products that have no images at all as 'done' so the worker doesn't pick them up
UPDATE public.products
SET mirror_status = 'done'
WHERE (images IS NULL OR images::text = '[]' OR jsonb_array_length(images) = 0)
  AND mirror_status = 'pending';

-- Mark products already on supabase storage as done
UPDATE public.products
SET mirror_status = 'done'
WHERE images::text LIKE '%xhejomioyecdfpvmohqh.supabase.co/storage%'
  AND mirror_status = 'pending';