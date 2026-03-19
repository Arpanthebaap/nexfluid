
-- =============================================
-- NEXFLUID Database Schema — Phase 1
-- =============================================

-- 1. Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.quote_status AS ENUM ('new', 'in_progress', 'quoted', 'closed');
CREATE TYPE public.product_status AS ENUM ('draft', 'pending_rewrite', 'published', 'archived');
CREATE TYPE public.supported_language AS ENUM ('it', 'en');

-- 2. Enable pg_trgm for partial product code search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3. Categories (hierarchical)
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT,
  meta_title_it TEXT,
  meta_title_en TEXT,
  meta_description_it TEXT,
  meta_description_en TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug, parent_id)
);

CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_active ON public.categories(is_active);

-- 4. Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_original TEXT,
  description_it TEXT,
  description_en TEXT,
  meta_title_it TEXT,
  meta_title_en TEXT,
  meta_description_it TEXT,
  meta_description_en TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  technical_specs JSONB DEFAULT '{}'::jsonb,
  status public.product_status NOT NULL DEFAULT 'draft',
  source_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_code ON public.products(product_code);
CREATE INDEX idx_products_code_trgm ON public.products USING gin(product_code gin_trgm_ops);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_name_it_trgm ON public.products USING gin(name_it gin_trgm_ops);
CREATE INDEX idx_products_name_en_trgm ON public.products USING gin(name_en gin_trgm_ops);

-- Full-text search index
ALTER TABLE public.products ADD COLUMN search_vector_it tsvector
  GENERATED ALWAYS AS (
    to_tsvector('italian', coalesce(product_code, '') || ' ' || coalesce(name_it, '') || ' ' || coalesce(description_it, '') || ' ' || coalesce(brand, ''))
  ) STORED;

ALTER TABLE public.products ADD COLUMN search_vector_en tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(product_code, '') || ' ' || coalesce(name_en, '') || ' ' || coalesce(description_en, '') || ' ' || coalesce(brand, ''))
  ) STORED;

CREATE INDEX idx_products_fts_it ON public.products USING gin(search_vector_it);
CREATE INDEX idx_products_fts_en ON public.products USING gin(search_vector_en);

-- 5. Product Attributes (dynamic filters)
CREATE TABLE public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  attribute_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_attrs_product ON public.product_attributes(product_id);
CREATE INDEX idx_product_attrs_name ON public.product_attributes(attribute_name);
CREATE INDEX idx_product_attrs_name_value ON public.product_attributes(attribute_name, attribute_value);

-- 6. Category Filter Definitions (admin-managed: which filters appear per category)
CREATE TABLE public.category_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  display_name_it TEXT NOT NULL,
  display_name_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(category_id, attribute_name)
);

CREATE INDEX idx_category_filters_cat ON public.category_filters(category_id);

-- 7. Quote Requests (lead generation)
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_name TEXT,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status public.quote_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  language public.supported_language NOT NULL DEFAULT 'it',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_status ON public.quote_requests(status);
CREATE INDEX idx_quotes_created ON public.quote_requests(created_at DESC);
CREATE INDEX idx_quotes_email ON public.quote_requests(email);

-- 8. User Roles (secure, separate table per instructions)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- 9. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 10. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. RLS Policies

-- Categories: public read, admin write
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Products: public read (active only), admin write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published products are publicly readable" ON public.products FOR SELECT USING (is_active = true AND status = 'published');
CREATE POLICY "Admins can read all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Product Attributes: public read, admin write
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attributes are publicly readable" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Admins can insert attributes" ON public.product_attributes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update attributes" ON public.product_attributes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete attributes" ON public.product_attributes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Category Filters: public read, admin write
ALTER TABLE public.category_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Category filters are publicly readable" ON public.category_filters FOR SELECT USING (true);
CREATE POLICY "Admins can manage category filters" ON public.category_filters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Quote Requests: anyone can insert, admin can read/update
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a quote request" ON public.quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read quote requests" ON public.quote_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update quote requests" ON public.quote_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Roles: admin read, no public access
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read user roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
