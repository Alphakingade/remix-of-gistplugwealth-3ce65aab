DROP POLICY IF EXISTS "Article images are publicly readable" ON storage.objects;
CREATE POLICY "Article images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Admins upload article images" ON storage.objects;
CREATE POLICY "Admins upload article images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update article images" ON storage.objects;
CREATE POLICY "Admins update article images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete article images" ON storage.objects;
CREATE POLICY "Admins delete article images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));