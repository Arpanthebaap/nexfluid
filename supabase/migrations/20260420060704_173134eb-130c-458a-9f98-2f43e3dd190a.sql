CREATE OR REPLACE FUNCTION public.filter_products(
  _category_id uuid,
  _filters jsonb DEFAULT '{}'::jsonb,
  _sort text DEFAULT 'relevance',
  _lang text DEFAULT 'it',
  _page int DEFAULT 0,
  _page_size int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  product_code text,
  name_it text,
  name_en text,
  slug text,
  brand text,
  images jsonb,
  description_it text,
  description_en text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _brands text[];
  _attr_filters jsonb;
  _wp_min numeric;
  _wp_max numeric;
  _at_min numeric;
  _at_max numeric;
  _offset int;
BEGIN
  _brands := COALESCE(ARRAY(SELECT jsonb_array_elements_text(_filters->'brand')), ARRAY[]::text[]);
  _attr_filters := COALESCE(_filters->'attributes', '{}'::jsonb);
  _wp_min := NULLIF(_filters->'ranges'->'working_pressure'->>'min','')::numeric;
  _wp_max := NULLIF(_filters->'ranges'->'working_pressure'->>'max','')::numeric;
  _at_min := NULLIF(_filters->'ranges'->'ambient_temp'->>'min','')::numeric;
  _at_max := NULLIF(_filters->'ranges'->'ambient_temp'->>'max','')::numeric;
  _offset := GREATEST(_page,0) * GREATEST(_page_size,1);

  RETURN QUERY
  WITH base AS (
    SELECT p.*
    FROM public.products p
    WHERE p.category_id = _category_id
      AND p.is_active = true
      AND p.status = 'published'
      AND (array_length(_brands,1) IS NULL OR p.brand = ANY(_brands))
      AND (
        _attr_filters = '{}'::jsonb
        OR NOT EXISTS (
          SELECT 1
          FROM jsonb_each(_attr_filters) AS f(attr_name, attr_values)
          WHERE NOT EXISTS (
            SELECT 1 FROM public.product_attributes pa
            WHERE pa.product_id = p.id
              AND pa.attribute_name = f.attr_name
              AND pa.attribute_value IN (
                SELECT jsonb_array_elements_text(f.attr_values)
              )
          )
        )
      )
      AND (_wp_min IS NULL OR EXISTS (
        SELECT 1 FROM public.product_attributes pa
        WHERE pa.product_id = p.id AND pa.attribute_name = 'Working Pressure Max'
          AND NULLIF(regexp_replace(pa.attribute_value,'[^0-9.\-]','','g'),'')::numeric >= _wp_min
      ))
      AND (_wp_max IS NULL OR EXISTS (
        SELECT 1 FROM public.product_attributes pa
        WHERE pa.product_id = p.id AND pa.attribute_name = 'Working Pressure Min'
          AND NULLIF(regexp_replace(pa.attribute_value,'[^0-9.\-]','','g'),'')::numeric <= _wp_max
      ))
      AND (_at_min IS NULL OR EXISTS (
        SELECT 1 FROM public.product_attributes pa
        WHERE pa.product_id = p.id AND pa.attribute_name = 'Ambient Temperature Max'
          AND NULLIF(regexp_replace(pa.attribute_value,'[^0-9.\-]','','g'),'')::numeric >= _at_min
      ))
      AND (_at_max IS NULL OR EXISTS (
        SELECT 1 FROM public.product_attributes pa
        WHERE pa.product_id = p.id AND pa.attribute_name = 'Ambient Temperature Min'
          AND NULLIF(regexp_replace(pa.attribute_value,'[^0-9.\-]','','g'),'')::numeric <= _at_max
      ))
  ),
  counted AS (
    SELECT (SELECT COUNT(*) FROM base)::bigint AS total
  )
  SELECT b.id, b.product_code, b.name_it, b.name_en, b.slug, b.brand, b.images,
         b.description_it, b.description_en, c.total
  FROM base b CROSS JOIN counted c
  ORDER BY
    CASE WHEN _sort = 'code_asc' THEN b.product_code END ASC NULLS LAST,
    CASE WHEN _sort = 'code_desc' THEN b.product_code END DESC NULLS LAST,
    CASE WHEN _sort = 'name_asc' AND _lang = 'it' THEN b.name_it END ASC NULLS LAST,
    CASE WHEN _sort = 'name_asc' AND _lang = 'en' THEN b.name_en END ASC NULLS LAST,
    CASE WHEN _sort = 'brand_asc' THEN b.brand END ASC NULLS LAST,
    CASE WHEN _sort = 'brand_asc' THEN b.product_code END ASC NULLS LAST,
    CASE WHEN _sort = 'recent' THEN b.created_at END DESC NULLS LAST,
    CASE WHEN _sort = 'relevance' OR _sort IS NULL THEN b.brand END ASC NULLS LAST,
    CASE WHEN _sort = 'relevance' OR _sort IS NULL THEN b.product_code END ASC NULLS LAST
  LIMIT GREATEST(_page_size,1)
  OFFSET _offset;
END;
$$;