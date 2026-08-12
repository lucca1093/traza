-- ============================================================
-- TRAZA — Fix RLS para usuarios independientes (empresa_id NULL)
-- Ejecutar completo en Supabase SQL Editor
-- ============================================================
-- CONTEXTO: los usuarios que se registran como profesionales
-- independientes tienen empresa_id = NULL en sus perfiles y
-- personas. Las políticas originales usan:
--   empresa_id = get_my_empresa_id()
-- Esto falla porque NULL = NULL es FALSE en SQL.
-- SOLUCIÓN: agregar políticas alternativas basadas en persona_id
-- usando get_my_persona_ids() que ya existe.
-- ============================================================


-- ============================================================
-- 1. objetivo_avances — SELECT, INSERT, UPDATE, DELETE
-- ============================================================

ALTER TABLE objetivo_avances ENABLE ROW LEVEL SECURITY;

-- SELECT: el empleado puede ver los avances de sus propios objetivos
CREATE POLICY IF NOT EXISTS "Empleado ve sus propios avances"
  ON objetivo_avances FOR SELECT
  USING (persona_id IN (SELECT public.get_my_persona_ids()));

-- INSERT: el empleado puede agregar avances a sus propios objetivos
CREATE POLICY IF NOT EXISTS "Empleado inserta sus propios avances"
  ON objetivo_avances FOR INSERT
  WITH CHECK (persona_id IN (SELECT public.get_my_persona_ids()));

-- UPDATE: el empleado puede editar sus propios avances
CREATE POLICY IF NOT EXISTS "Empleado actualiza sus propios avances"
  ON objetivo_avances FOR UPDATE
  USING (persona_id IN (SELECT public.get_my_persona_ids()));

-- DELETE: el empleado puede eliminar sus propios avances
CREATE POLICY IF NOT EXISTS "Empleado elimina sus propios avances"
  ON objetivo_avances FOR DELETE
  USING (persona_id IN (SELECT public.get_my_persona_ids()));

-- SELECT para supervisor: puede ver avances de su empresa
CREATE POLICY IF NOT EXISTS "Supervisor ve avances de su empresa"
  ON objetivo_avances FOR SELECT
  USING (
    empresa_id IS NOT NULL
    AND empresa_id = public.get_my_empresa_id()
    AND public.get_my_role() IN ('admin', 'supervisor', 'super_admin')
  );

-- UPDATE para supervisor: puede aprobar/rechazar avances
CREATE POLICY IF NOT EXISTS "Supervisor actualiza avances de su empresa"
  ON objetivo_avances FOR UPDATE
  USING (
    empresa_id IS NOT NULL
    AND empresa_id = public.get_my_empresa_id()
    AND public.get_my_role() IN ('admin', 'supervisor', 'super_admin')
  );


-- ============================================================
-- 2. cierres_semanales — SELECT, INSERT, UPDATE
-- ============================================================

ALTER TABLE cierres_semanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Empleado ve sus propios cierres"
  ON cierres_semanales FOR SELECT
  USING (persona_id IN (SELECT public.get_my_persona_ids()));

CREATE POLICY IF NOT EXISTS "Empleado inserta sus propios cierres"
  ON cierres_semanales FOR INSERT
  WITH CHECK (persona_id IN (SELECT public.get_my_persona_ids()));

CREATE POLICY IF NOT EXISTS "Empleado actualiza sus propios cierres"
  ON cierres_semanales FOR UPDATE
  USING (persona_id IN (SELECT public.get_my_persona_ids()));

-- Supervisor: ver cierres de su empresa
CREATE POLICY IF NOT EXISTS "Supervisor ve cierres de su empresa"
  ON cierres_semanales FOR SELECT
  USING (
    empresa_id IS NOT NULL
    AND empresa_id = public.get_my_empresa_id()
    AND public.get_my_role() IN ('admin', 'supervisor', 'super_admin')
  );


-- ============================================================
-- 3. objetivo_grupos — SELECT, INSERT
-- ============================================================

ALTER TABLE objetivo_grupos ENABLE ROW LEVEL SECURITY;

-- Ver grupos donde participan mis objetivos
CREATE POLICY IF NOT EXISTS "Empleado ve sus grupos"
  ON objetivo_grupos FOR SELECT
  USING (
    id IN (
      SELECT grupo_id FROM objetivos
      WHERE persona_id IN (SELECT public.get_my_persona_ids())
      AND grupo_id IS NOT NULL
    )
    OR creado_por = auth.uid()
  );

-- Crear grupos (para objetivos con colaborador externo)
CREATE POLICY IF NOT EXISTS "Empleado crea sus grupos"
  ON objetivo_grupos FOR INSERT
  WITH CHECK (creado_por = auth.uid());

-- Admin/supervisor puede ver grupos de su empresa
CREATE POLICY IF NOT EXISTS "Admin ve grupos de su empresa"
  ON objetivo_grupos FOR SELECT
  USING (
    empresa_id IS NOT NULL
    AND empresa_id = public.get_my_empresa_id()
    AND public.get_my_role() IN ('admin', 'supervisor', 'super_admin')
  );

CREATE POLICY IF NOT EXISTS "Admin gestiona grupos de su empresa"
  ON objetivo_grupos FOR ALL
  USING (
    empresa_id IS NOT NULL
    AND empresa_id = public.get_my_empresa_id()
    AND public.get_my_role() IN ('admin', 'supervisor', 'super_admin')
  );


-- ============================================================
-- 4. objetivos — INSERT y DELETE para independientes
-- (SELECT y UPDATE ya están cubiertos por cambio1-propiedad-datos.sql)
-- ============================================================

-- INSERT: independiente puede crear objetivos personales
-- (La policy original requería empresa_id = get_my_empresa_id(),
--  fallando para empresa_id NULL. Esta política alternativa lo permite.)
CREATE POLICY IF NOT EXISTS "Independiente crea sus objetivos personales"
  ON objetivos FOR INSERT
  WITH CHECK (
    empresa_id IS NULL
    AND tipo = 'Personal'
    AND persona_id IN (SELECT public.get_my_persona_ids())
  );

-- DELETE: independiente puede eliminar sus objetivos
CREATE POLICY IF NOT EXISTS "Independiente elimina sus objetivos"
  ON objetivos FOR DELETE
  USING (
    empresa_id IS NULL
    AND persona_id IN (SELECT public.get_my_persona_ids())
  );


-- ============================================================
-- 5. personas — INSERT para independientes
-- (por si setup-persona API falla y el cliente necesita retry)
-- ============================================================

CREATE POLICY IF NOT EXISTS "Independiente inserta su propia persona"
  ON personas FOR INSERT
  WITH CHECK (user_id = auth.uid() AND empresa_id IS NULL);


-- ============================================================
-- VERIFICACIÓN — ejecutar para confirmar
-- ============================================================

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'objetivo_avances', 'cierres_semanales', 'objetivo_grupos',
  'objetivos', 'personas'
)
ORDER BY tablename, cmd, policyname;
