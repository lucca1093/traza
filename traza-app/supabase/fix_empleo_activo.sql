-- ═══════════════════════════════════════════════════════════════
-- FIX_EMPLEO_ACTIVO.SQL
-- Corrige empleo_activo para todos los demo personas de Grupo Meridian.
-- Asegura que solo la fila de Grupo Meridian tenga empleo_activo = true.
-- Si existe historial anterior (otras empresas), queda con empleo_activo = false.
-- ═══════════════════════════════════════════════════════════════

-- ID de Grupo Meridian S.A.
-- 4ffe2f78-5a3f-47c5-82b7-f903e6a39406

-- ── DIAGNÓSTICO (correr primero para ver el estado actual) ─────
SELECT
  p.nombre, p.apellido, p.cargo,
  e.nombre AS empresa,
  p.empleo_activo,
  p.fecha_inicio_empleo,
  p.fecha_fin_empleo,
  p.traza_id
FROM personas p
LEFT JOIN empresas e ON e.id = p.empresa_id
WHERE (p.nombre, p.apellido) IN (
  ('Valentina', 'Cruz'), ('Martín', 'Aguirre'), ('Luciana', 'Ferreyra'),
  ('Diego', 'Molina'), ('Camila', 'Ortega'), ('Florencia', 'Herrera'),
  ('Gonzalo', 'Sánchez'), ('Renata', 'Paz'), ('Santiago', 'Ibáñez'),
  ('Sofía', 'Reynoso')
)
ORDER BY p.nombre, p.apellido, p.fecha_inicio_empleo DESC;


-- ── FIX 1: Desactivar filas en otras empresas para los mismos traza_id ──────
-- Aplica a personas que comparten traza_id con alguien en Meridian
-- pero están en una empresa diferente (historial anterior).
UPDATE personas
SET
  empleo_activo    = false,
  fecha_fin_empleo = COALESCE(fecha_fin_empleo, (CURRENT_DATE - INTERVAL '1 day')::date)
WHERE traza_id IN (
  SELECT DISTINCT traza_id
  FROM personas
  WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
    AND traza_id IS NOT NULL
)
AND empresa_id != '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
AND traza_id IS NOT NULL;


-- ── FIX 2: Asegurar activo=true y sin fecha_fin en las filas de Meridian ─────
UPDATE personas
SET
  empleo_activo    = true,
  fecha_fin_empleo = NULL
WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
  AND (nombre, apellido) IN (
    ('Valentina', 'Cruz'),
    ('Martín',    'Aguirre'),
    ('Luciana',   'Ferreyra'),
    ('Diego',     'Molina'),
    ('Camila',    'Ortega'),
    ('Florencia', 'Herrera'),
    ('Gonzalo',   'Sánchez'),
    ('Renata',    'Paz'),
    ('Santiago',  'Ibáñez'),
    ('Sofía',     'Reynoso')
  );


-- ── VERIFICACIÓN: debe mostrar solo 1 fila activa por persona ────────────────
SELECT
  p.nombre, p.apellido,
  e.nombre AS empresa,
  p.empleo_activo,
  p.fecha_inicio_empleo,
  p.fecha_fin_empleo
FROM personas p
LEFT JOIN empresas e ON e.id = p.empresa_id
WHERE (p.nombre, p.apellido) IN (
  ('Valentina', 'Cruz'), ('Martín', 'Aguirre'), ('Luciana', 'Ferreyra'),
  ('Diego', 'Molina'), ('Camila', 'Ortega'), ('Florencia', 'Herrera'),
  ('Gonzalo', 'Sánchez'), ('Renata', 'Paz'), ('Santiago', 'Ibáñez'),
  ('Sofía', 'Reynoso')
)
ORDER BY p.nombre, p.apellido, p.empleo_activo DESC;
