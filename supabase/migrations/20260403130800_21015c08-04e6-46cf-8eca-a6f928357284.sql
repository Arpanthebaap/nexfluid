
CREATE OR REPLACE FUNCTION public.get_brand_category_counts(_brand text)
RETURNS TABLE(category_id uuid, product_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.category_id, COUNT(*) AS product_count
  FROM public.products p
  WHERE p.is_active = true
    AND p.status = 'published'
    AND p.brand ILIKE _brand
    AND p.category_id IS NOT NULL
  GROUP BY p.category_id
$$;
