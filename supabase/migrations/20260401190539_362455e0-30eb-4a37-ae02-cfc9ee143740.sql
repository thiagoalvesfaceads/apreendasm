
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Service role insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'generated-images');
