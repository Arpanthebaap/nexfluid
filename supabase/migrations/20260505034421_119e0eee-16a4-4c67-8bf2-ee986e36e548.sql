ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brands text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_brands ON public.products USING GIN (brands);

CREATE OR REPLACE FUNCTION public.get_brand_category_counts(_brand text)
 RETURNS TABLE(category_id uuid, product_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.category_id, COUNT(*) AS product_count
  FROM public.products p
  WHERE p.is_active = true
    AND p.status = 'published'
    AND (upper(_brand) = ANY(p.brands) OR p.brand ILIKE _brand)
    AND p.category_id IS NOT NULL
  GROUP BY p.category_id
$function$;