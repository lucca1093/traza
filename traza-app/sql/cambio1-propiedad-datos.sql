-- ============================================================
-- TRAZA — Cambio 1: Propiedad de datos del empleado
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Objetivo: que los datos del empleado le pertenezcan a él,
-- no a la empresa. Si la empresa cancela, el empleado conserva
-- su credencial, su historial y su score.
-- ============================================================


-- ============================================================
-- PASO 1: credencial_publica en personas
-- Controla si la URL /p/[trazaId] está activa.
-- Default TRUE = activa por defecto para todos los existentes.
-- ============================================================

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS credencial_publica BOOLEAN DEFAULT TRUE;

-- Activar para todos los existentes
UPDATE personas SET credencial_publica = TRUE WHERE credencial_publica IS NULL;


-- ============================================================
-- PASO 2: suscripcion_activa en empresas
-- Base para el gating de features por empresa en el futuro.
-- Default TRUE = no rompe nada hoy.
-- ============================================================

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS suscripcion_activa BOOLEAN DEFAULT TRUE;

UPDATE empresas SET suscripcion_activa = TRUE WHERE suscripcion_activa IS NULL;


-- ============================================================
-- PASO 3: empresa_id en personas pasa de NOT NULL + CASCADE
--         a nullable + SET NULL
-- Si la empresa se elimina, la persona y su historial sobreviven.
-- ============================================================

-- 3a. Quitar el NOT NULL
ALTER TABLE personas
  ALTER COLUMN empresa_id DROP NOT NULL;

-- 3b. Cambiar la FK de CASCADE a SET NULL
ALTER TABLE personas
  DROP CONSTRAINT IF EXISTS personas_empresa_id_fkey;

ALTER TABLE personas
  ADD CONSTRAINT personas_empresa_id_fkey
  FOREIGN KEY (empresa_id)
  REFERENCES empresas(id)
  ON DELETE SET NULL;

-- Lo mismo para objetivos: si la empresa se elimina,
-- el objetivo queda huérfano pero no se borra.
ALTER TABLE objetivos
  DROP CONSTRAINT IF EXISTS objetivos_empresa_id_fkey;

ALTER TABLE objetivos
  ADD CONSTRAINT objetivos_empresa_id_fkey
  FOREIGN KEY (empresa_id)
  REFERENCES empresas(id)
  ON DELETE SET NULL;

ALTER TABLE objetivos
  ALTER COLUMN empresa_id DROP NOT NULL;


-- ============================================================
-- PASO 4: Función helper — IDs de todas las personas del usuario
-- Necesaria para las políticas RLS de "capa empleado".
-- Un usuario puede tener N personas (una por empresa).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_persona_ids()
RETURNS SETOF UUID
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.personas WHERE user_id = auth.uid()
$$;

-- Índice para que la función sea rápida
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);


-- ============================================================
-- PASO 5: Políticas RLS — Capa empleado (siempre activa)
-- Estas políticas se suman a las existentes con OR lógico.
-- Permiten que el empleado siempre vea y edite sus propios
-- datos, independientemente del estado de la empresa.
-- ============================================================

-- 5a. Persona: el empleado siempre puede leer la suya
CREATE POLICY "Empleado siempre ve su propia persona"
  ON public.personas FOR SELECT
  USING (user_id = auth.uid());

-- 5b. Persona: el empleado siempre puede actualizarla
--     (para campos como credencial_publica, disponible_para_busqueda)
CREATE POLICY "Empleado siempre actualiza su propia persona"
  ON public.personas FOR UPDATE
  USING (user_id = auth.uid());

-- 5c. Objetivos: el empleado siempre puede leer los suyos
CREATE POLICY "Empleado siempre ve sus propios objetivos"
  ON public.objetivos FOR SELECT
  USING (persona_id IN (SELECT public.get_my_persona_ids()));

-- 5d. Objetivos: el empleado siempre puede actualizar los suyos
--     (la policy existente ya lo permite vía empresa_id, pero
--      esta garantiza acceso incluso si empresa_id es NULL)
CREATE POLICY "Empleado siempre actualiza sus propios objetivos"
  ON public.objetivos FOR UPDATE
  USING (persona_id IN (SELECT public.get_my_persona_ids()));


-- ============================================================
-- PASO 6: Índice en credencial_publica para la página pública
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_personas_credencial_publica
  ON personas(traza_id, credencial_publica)
  WHERE credencial_publica = TRUE;


-- ============================================================
-- VERIFICACIÓN — ejecutar para confirmar que todo quedó bien
-- ============================================================

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personas'
  AND column_name IN ('empresa_id', 'credencial_publica', 'disponible_para_busqueda', 'user_id')
ORDER BY column_name;

SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'empresas'
  AND column_name = 'suscripcion_activa';

SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('personas', 'objetivos')
  AND policyname LIKE 'Empleado siempre%'
ORDER BY tablename, policyname;
