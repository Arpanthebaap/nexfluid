INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Category images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'category-images');

CREATE POLICY "Public can upload category images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'category-images');