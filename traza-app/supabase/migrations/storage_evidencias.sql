-- ============================================================
-- TRAZA — Storage bucket para archivos de evidencia
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear el bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias',
  'evidencias',
  true,
  10485760,  -- 10 MB por archivo
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Usuarios autenticados pueden subir archivos
CREATE POLICY "auth_upload_evidencias"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidencias'
  AND auth.role() = 'authenticated'
);

-- 3. Lectura pública (validadores externos también pueden ver los archivos)
CREATE POLICY "public_read_evidencias"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidencias');

-- 4. El propietario puede eliminar sus archivos
CREATE POLICY "owner_delete_evidencias"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidencias'
  AND owner = auth.uid()
);

-- Verificar:
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'evidencias';
