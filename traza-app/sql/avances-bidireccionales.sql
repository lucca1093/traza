-- ============================================================
-- TRAZA — Avances bidireccionales + objetivo continuo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Flag "objetivo continuo" en objetivos
--    Los objetivos continuos (ej: Hábitos) no penalizan el índice
--    si no están completados — son de largo plazo o permanentes.
ALTER TABLE objetivos
  ADD COLUMN IF NOT EXISTS es_continuo boolean DEFAULT false;

-- 2. Estado de revisión de cada avance (3 estados)
--    sin_revisar → visto → aprobado
ALTER TABLE objetivo_avances
  ADD COLUMN IF NOT EXISTS estado_revision text DEFAULT 'sin_revisar'
    CHECK (estado_revision IN ('sin_revisar', 'visto', 'aprobado'));

-- 3. Respuesta del supervisor al avance
ALTER TABLE objetivo_avances
  ADD COLUMN IF NOT EXISTS respuesta_supervisor text,
  ADD COLUMN IF NOT EXISTS respondido_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS respondido_en timestamptz;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_objetivos_continuo ON objetivos(es_continuo);
CREATE INDEX IF NOT EXISTS idx_avances_estado ON objetivo_avances(objetivo_id, estado_revision);

-- Verificar:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'objetivo_avances'
  AND column_name IN ('estado_revision', 'respuesta_supervisor', 'respondido_por', 'respondido_en', 'aprobado')
ORDER BY column_name;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'objetivos'
  AND column_name = 'es_continuo';
