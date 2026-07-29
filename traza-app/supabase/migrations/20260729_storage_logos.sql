-- Bucket público para logos de empresas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152, -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Cualquier usuario autenticado puede subir/actualizar logos de su empresa
CREATE POLICY "Admins pueden subir logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Admins pueden actualizar logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- Todo el mundo puede ver los logos (bucket público)
CREATE POLICY "Logos son públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Admins pueden borrar logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');
