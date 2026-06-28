-- ============================================================
-- TRAZA — Migration: mood_checks
-- Pegar en Supabase → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS mood_checks (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id  UUID        NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  mood        INTEGER     NOT NULL CHECK (mood BETWEEN 1 AND 5),
  nota        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(persona_id, fecha)
);

-- Índice para queries por persona + fecha
CREATE INDEX IF NOT EXISTS idx_mood_checks_persona_fecha
  ON mood_checks(persona_id, fecha DESC);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE mood_checks ENABLE ROW LEVEL SECURITY;

-- Empleado: puede leer y escribir sus propios registros
CREATE POLICY "mood_own_access"
  ON mood_checks
  FOR ALL
  TO authenticated
  USING (
    persona_id IN (
      SELECT id FROM personas
      WHERE user_id = auth.uid() AND empleo_activo = true
    )
  )
  WITH CHECK (
    persona_id IN (
      SELECT id FROM personas
      WHERE user_id = auth.uid() AND empleo_activo = true
    )
  );

-- Admin / supervisor / superadmin: pueden leer (no escribir) moods de su empresa
CREATE POLICY "mood_admin_read"
  ON mood_checks
  FOR SELECT
  TO authenticated
  USING (
    persona_id IN (
      SELECT p.id
      FROM personas p
      JOIN profiles pr ON pr.empresa_id = p.empresa_id
      WHERE pr.id = auth.uid()
        AND pr.rol IN ('super_admin', 'admin', 'supervisor')
    )
  );
