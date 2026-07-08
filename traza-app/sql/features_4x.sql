-- ============================================================
-- TRAZA — SQL Features 4.1 a 4.5
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 4.3 / 4.5: Empresa actual + supervisor manual en personas ────────────────
ALTER TABLE personas ADD COLUMN IF NOT EXISTS empresa_actual_nombre text;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS empresa_actual_dominio text;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS supervisor_nombre       text;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS supervisor_email        text;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS supervisor_verificado   boolean DEFAULT false;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS supervisor_token        text UNIQUE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS supervisor_solicitado_en timestamptz;

-- ── 4.2: Confirmamos que estado_revision existe en objetivo_avances ──────────
-- (puede que ya exista; ADD COLUMN IF NOT EXISTS es idempotente)
ALTER TABLE objetivo_avances ADD COLUMN IF NOT EXISTS estado_revision text DEFAULT 'sin_revisar'
  CHECK (estado_revision IN ('sin_revisar', 'visto', 'aprobado', 'devuelto'));
ALTER TABLE objetivo_avances ADD COLUMN IF NOT EXISTS respuesta_supervisor text;
ALTER TABLE objetivo_avances ADD COLUMN IF NOT EXISTS revisado_en timestamptz;

-- ── 4.1: Tabla feedback_cliente ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_cliente (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  objetivo_id     uuid REFERENCES objetivos(id) ON DELETE CASCADE NOT NULL,
  empresa_id      uuid REFERENCES empresas(id)  ON DELETE SET NULL,
  persona_id      uuid REFERENCES personas(id)  ON DELETE CASCADE NOT NULL,
  nombre_cliente  text NOT NULL,
  email_cliente   text NOT NULL,
  token_acceso    text UNIQUE NOT NULL,
  confirmado      boolean DEFAULT false,
  puntuacion      integer CHECK (puntuacion BETWEEN 1 AND 5),
  comentario      text,
  enviado_en      timestamptz DEFAULT now(),
  respondido_en   timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- RLS para feedback_cliente
ALTER TABLE feedback_cliente ENABLE ROW LEVEL SECURITY;

-- Empleados ven sus propios feedbacks
CREATE POLICY "empleado_ve_sus_feedbacks" ON feedback_cliente
  FOR SELECT USING (
    persona_id IN (
      SELECT id FROM personas WHERE user_id = auth.uid()
    )
  );

-- Solo el servidor (service_role) puede insertar/actualizar
-- (las rutas usan createAdminClient que usa service_role)

-- ── 4.1: Agregar feedback_cliente a realtime (opcional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE feedback_cliente;

-- ── Índices para performance ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feedback_cliente_persona  ON feedback_cliente(persona_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cliente_objetivo ON feedback_cliente(objetivo_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cliente_token    ON feedback_cliente(token_acceso);
CREATE INDEX IF NOT EXISTS idx_personas_supervisor_token ON personas(supervisor_token);
