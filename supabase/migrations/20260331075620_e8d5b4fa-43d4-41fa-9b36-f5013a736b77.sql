
CREATE TABLE public.source_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  last_discovered_at timestamptz,
  product_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.source_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage source links" ON public.source_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Source links publicly readable" ON public.source_links
  FOR SELECT TO public
  USING (true);

-- Seed with existing source URLs
INSERT INTO public.source_links (url, label) VALUES
  ('https://www.valves-direct.com/3-air-preparation-equipment', 'Air Preparation Equipment'),
  ('https://www.valves-direct.com/4-manually-operated-valves', 'Manually Operated Valves'),
  ('https://www.valves-direct.com/5-pinch-valves', 'Pinch Valves'),
  ('https://www.valves-direct.com/6-pneumatic-cylinders', 'Pneumatic Cylinders'),
  ('https://www.valves-direct.com/7-proportional-valves', 'Proportional Valves'),
  ('https://www.valves-direct.com/8-seat-valves', 'Seat Valves'),
  ('https://www.valves-direct.com/9-sensors-switches', 'Sensors & Switches'),
  ('https://www.valves-direct.com/10-solenoid-valves', 'Solenoid Valves'),
  ('https://www.valves-direct.com/11-vacuum-technologies', 'Vacuum Technologies'),
  ('https://www.valves-direct.com/12-valve-systems', 'Valve Systems'),
  ('https://it.rs-online.com/web/b/parker/', 'Parker (RS Online)')
ON CONFLICT (url) DO NOTHING;
