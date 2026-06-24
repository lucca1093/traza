-- ============================================================
-- TRAZA — Nuevas features: categorías, multi-validación, progreso
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Categoría del objetivo
ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS categoria text
  DEFAULT 'Resultado'
  CHECK (categoria IN ('Resultado', 'Eficiencia', 'Aprendizaje', 'Hábito'));

-- 2. Progreso incremental (0-100)
ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS progreso integer DEFAULT 0
  CHECK (progreso >= 0 AND progreso <= 100);

-- 3. Segunda validación (admin/dueño)
ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS validacion_admin text
  CHECK (validacion_admin IN ('De acuerdo', 'Parcialmente de acuerdo', 'En desacuerdo'));

ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS validacion_admin_por uuid REFERENCES auth.users(id);
ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS comentario_admin text;

-- 4. Índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_objetivos_categoria ON objetivos(categoria);

-- Verificar que quedó bien:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'objetivos'
  AND column_name IN ('categoria', 'progreso', 'validacion_admin', 'validacion_admin_por', 'comentario_admin')
ORDER BY column_name;
