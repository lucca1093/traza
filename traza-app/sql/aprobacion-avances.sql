-- ============================================================
-- TRAZA — Aprobación de avances por supervisor
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agrega campos de aprobación a objetivo_avances
ALTER TABLE objetivo_avances
  ADD COLUMN IF NOT EXISTS aprobado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS aprobado_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS aprobado_en timestamptz;

-- Índice para búsquedas de avances aprobados
CREATE INDEX IF NOT EXISTS idx_avances_aprobado ON objetivo_avances(objetivo_id, aprobado);

-- Verificar:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'objetivo_avances'
  AND column_name IN ('aprobado', 'aprobado_por', 'aprobado_en')
ORDER BY column_name;
