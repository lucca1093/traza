-- ============================================================
-- TRAZA — Cambio 2: Registro individual + Validación externa
-- Ejecutar en Supabase SQL Editor (en tandas si es necesario)
-- ============================================================


-- ============================================================
-- PASO 1: tipo_cuenta en personas
-- 'empresa' = flujo tradicional (invitado por empresa)
-- 'individual' = se registró solo, sin empresa
-- ============================================================

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS tipo_cuenta TEXT DEFAULT 'empresa'
  CHECK (tipo_cuenta IN ('empresa', 'individual'));

UPDATE personas SET tipo_cuenta = 'empresa' WHERE tipo_cuenta IS NULL;


-- ============================================================
-- PASO 2: origen y modo_validacion en objetivos
-- origen: si fue asignado por la empresa o autodefinido
-- modo_validacion: si la validación viene de dentro o de una invitación
-- ============================================================

ALTER TABLE objetivos
  ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'asignado'
  CHECK (origen IN ('asignado', 'autodefinido'));

ALTER TABLE objetivos
  ADD COLUMN IF NOT EXISTS modo_validacion TEXT DEFAULT 'empresa'
  CHECK (modo_validacion IN ('empresa', 'invitacion'));

UPDATE objetivos SET origen = 'asignado' WHERE origen IS NULL;
UPDATE objetivos SET modo_validacion = 'empresa' WHERE modo_validacion IS NULL;


-- ============================================================
-- PASO 3: tabla tokens_validacion
-- Cada token es un link único para que un evaluador externo
-- valide un objetivo sin necesitar cuenta en TRAZA.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tokens_validacion (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  objetivo_id  UUID REFERENCES public.objetivos(id) ON DELETE CASCADE NOT NULL,
  token        TEXT UNIQUE NOT NULL,
  creado_por   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creado_en    TIMESTAMPTZ DEFAULT NOW(),
  expira_en    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  usado_en     TIMESTAMPTZ,
  usado        BOOLEAN DEFAULT FALSE
);

-- Índice para lookup rápido por token
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens_validacion(token);
CREATE INDEX IF NOT EXISTS idx_tokens_objetivo ON tokens_validacion(objetivo_id);

-- RLS
ALTER TABLE public.tokens_validacion ENABLE ROW LEVEL SECURITY;

-- El empleado puede ver y crear tokens para sus propios objetivos
CREATE POLICY tokens_ver ON public.tokens_validacion
  FOR SELECT USING (
    objetivo_id IN (
      SELECT o.id FROM objetivos o
      WHERE o.persona_id IN (SELECT public.get_my_persona_ids())
    )
    OR creado_por = auth.uid()
  );

CREATE POLICY tokens_crear ON public.tokens_validacion
  FOR INSERT WITH CHECK (creado_por = auth.uid());

-- Admin y supervisor pueden ver tokens de su empresa
CREATE POLICY tokens_admin ON public.tokens_validacion
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'supervisor', 'super_admin')
  );


-- ============================================================
-- PASO 4: tabla validaciones_externas
-- Guarda la evaluación del evaluador externo.
-- El campo "token_id" la vincula al objetivo.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.validaciones_externas (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token_id     UUID REFERENCES public.tokens_validacion(id) ON DELETE SET NULL,
  objetivo_id  UUID REFERENCES public.objetivos(id) ON DELETE CASCADE NOT NULL,
  nombre       TEXT NOT NULL,
  email        TEXT,
  cargo        TEXT,
  empresa      TEXT,
  calificacion TEXT NOT NULL
    CHECK (calificacion IN ('De acuerdo', 'Parcialmente de acuerdo', 'En desacuerdo')),
  comentario   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_valext_objetivo ON validaciones_externas(objetivo_id);

-- RLS
ALTER TABLE public.validaciones_externas ENABLE ROW LEVEL SECURITY;

-- El empleado puede ver las validaciones de sus objetivos
CREATE POLICY valext_ver ON public.validaciones_externas
  FOR SELECT USING (
    objetivo_id IN (
      SELECT o.id FROM objetivos o
      WHERE o.persona_id IN (SELECT public.get_my_persona_ids())
    )
  );

-- Admin puede ver las de su empresa
CREATE POLICY valext_admin ON public.validaciones_externas
  FOR SELECT USING (
    objetivo_id IN (
      SELECT o.id FROM objetivos o WHERE o.empresa_id = public.get_my_empresa_id()
    )
    AND public.get_my_role() IN ('admin', 'supervisor', 'super_admin')
  );

-- Insert abierto para el validador externo (sin auth)
-- Lo manejamos server-side con service role key, no por RLS
-- La tabla acepta inserts del service role solamente


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'personas' AND column_name = 'tipo_cuenta';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'objetivos' AND column_name IN ('origen', 'modo_validacion')
ORDER BY column_name;

SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tokens_validacion', 'validaciones_externas');
