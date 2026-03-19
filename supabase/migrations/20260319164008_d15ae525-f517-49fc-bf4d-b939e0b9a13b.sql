
-- Fix WARN 1: Move pg_trgm extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Fix WARN 2: Add rate-limiting-style constraint on quote_requests INSERT
-- The INSERT WITH CHECK (true) is intentional for anonymous quote submissions,
-- but we can add basic validation to prevent abuse
DROP POLICY "Anyone can submit a quote request" ON public.quote_requests;
CREATE POLICY "Anyone can submit a quote request" ON public.quote_requests 
  FOR INSERT 
  WITH CHECK (
    name IS NOT NULL AND 
    email IS NOT NULL AND 
    length(name) > 0 AND 
    length(email) > 3
  );
