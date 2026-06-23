-- ============================================================
-- TRAZA — Arquitectura de Identidad Portable
-- ============================================================
-- Objetivo: que el traza_id acumule historial de múltiples
-- empresas. Una persona puede tener N registros en "personas"
-- (uno por empresa donde trabajó), todos con el mismo traza_id.
--
-- INSTRUCCIONES:
-- 1. Ejecutar el bloque "PREPARACIÓN" primero
-- 2. Verificar que no haya errores
-- 3. Ejecutar el bloque "CREDENCIAL" para actualizar la query
--    pública (esto ya está implementado en código, solo es
--    referencia documentativa)
-- ============================================================

-- ============================================================
-- PASO 1: Eliminar el UNIQUE constraint de traza_id en personas
-- (actualmente bloquea que la misma persona esté en 2 empresas)
-- ============================================================

-- Primero encontramos el nombre del constraint:
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name = 'personas' AND constraint_type = 'UNIQUE';

-- Luego lo eliminamos (reemplazar el nombre si es distinto):
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_traza_id_key;

-- Creamos un índice normal (no unique) para que las búsquedas
-- por traza_id sigan siendo rápidas:
CREATE INDEX IF NOT EXISTS idx_personas_traza_id ON personas(traza_id);


-- ============================================================
-- PASO 2: Agregar columna "activo" para saber en qué empresa
-- está trabajando actualmente la persona
-- ============================================================

ALTER TABLE personas ADD COLUMN IF NOT EXISTS empleo_activo boolean DEFAULT true;

-- Cuando una persona cambia de empresa, el registro anterior
-- se marca como empleo_activo = false. El nuevo registro
-- (en la nueva empresa) se crea con empleo_activo = true.


-- ============================================================
-- PASO 3: Agregar fechas de inicio/fin de cada empleo
-- ============================================================

ALTER TABLE personas ADD COLUMN IF NOT EXISTS fecha_inicio_empleo date;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS fecha_fin_empleo date;

-- Actualizar los registros existentes con fecha aproximada:
UPDATE personas SET fecha_inicio_empleo = CURRENT_DATE WHERE fecha_inicio_empleo IS NULL;


-- ============================================================
-- PASO 4: Vista pública del historial completo por traza_id
-- (agrega métricas de todas las empresas)
-- ============================================================

CREATE OR REPLACE VIEW vista_credencial_traza AS
SELECT
  p.traza_id,
  p.nombre,
  p.apellido,
  -- Empresa actual
  (SELECT e.nombre FROM empresas e
   JOIN personas p2 ON p2.empresa_id = e.id
   WHERE p2.traza_id = p.traza_id AND p2.empleo_activo = true
   LIMIT 1) AS empresa_actual,
  -- Cargo actual
  (SELECT p2.cargo FROM personas p2
   WHERE p2.traza_id = p.traza_id AND p2.empleo_activo = true
   LIMIT 1) AS cargo_actual,
  -- Área actual
  (SELECT p2.area FROM personas p2
   WHERE p2.traza_id = p.traza_id AND p2.empleo_activo = true
   LIMIT 1) AS area_actual,
  -- Cantidad de empresas en historial
  COUNT(DISTINCT p.empresa_id) AS total_empresas,
  -- Total objetivos (todas las empresas)
  COUNT(DISTINCT o.id) AS total_objetivos,
  -- Completados (todas las empresas)
  COUNT(DISTINCT CASE WHEN o.estado = 'Completado' THEN o.id END) AS total_completados,
  -- Validados positivos (todas las empresas)
  COUNT(DISTINCT CASE WHEN o.validacion = 'De acuerdo' THEN o.id END) AS total_positivos,
  -- Validados parciales
  COUNT(DISTINCT CASE WHEN o.validacion = 'Parcialmente de acuerdo' THEN o.id END) AS total_parciales,
  -- Validados negativos
  COUNT(DISTINCT CASE WHEN o.validacion = 'En desacuerdo' THEN o.id END) AS total_negativos,
  -- Fecha más temprana de actividad
  MIN(p.fecha_inicio_empleo) AS miembro_desde
FROM personas p
LEFT JOIN objetivos o ON o.persona_id = p.id
GROUP BY p.traza_id, p.nombre, p.apellido;


-- ============================================================
-- PASO 5 (FUTURO): Cuando una persona cambia de empresa
-- ============================================================
-- 1. Marcar registro actual como inactivo:
--    UPDATE personas SET empleo_activo = false, fecha_fin_empleo = CURRENT_DATE
--    WHERE traza_id = 'TRZ-XXXX-XXX' AND empleo_activo = true;
--
-- 2. Crear nuevo registro con la nueva empresa y el MISMO traza_id:
--    INSERT INTO personas (traza_id, nombre, apellido, empresa_id, cargo, area, empleo_activo, fecha_inicio_empleo)
--    VALUES ('TRZ-XXXX-XXX', 'Juan', 'García', [nueva_empresa_id], 'Nuevo cargo', 'Nueva área', true, CURRENT_DATE);
--
-- La credencial pública en /p/TRZ-XXXX-XXX automáticamente
-- mostrará el historial acumulado de ambas empresas.
-- ============================================================
