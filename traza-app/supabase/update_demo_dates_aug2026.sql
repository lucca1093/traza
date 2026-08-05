-- ═══════════════════════════════════════════════════════════════
-- TRAZA — Actualizar fechas demo a agosto 2026
-- Pegá esto completo en Supabase SQL Editor y ejecutalo.
-- ═══════════════════════════════════════════════════════════════

-- ── Objetivos Nicolás (profesional) ───────────────────────────
-- Completados: fechas pasadas de 2026
UPDATE objetivos SET fecha_limite = '2026-04-15'
  WHERE id = 'cc000001-cc00-4000-a000-000000000001';

UPDATE objetivos SET fecha_limite = '2026-03-31'
  WHERE id = 'cc000002-cc00-4000-a000-000000000001';

UPDATE objetivos SET fecha_limite = '2026-03-31'
  WHERE id = 'cc000003-cc00-4000-a000-000000000001';

UPDATE objetivos SET fecha_limite = '2026-06-30'
  WHERE id = 'cc000004-cc00-4000-a000-000000000001';

UPDATE objetivos SET fecha_limite = '2026-04-30'
  WHERE id = 'cc000005-cc00-4000-a000-000000000001';

-- En progreso: fechas futuras desde agosto 2026
UPDATE objetivos SET fecha_limite = '2026-11-30'
  WHERE id = 'cc000006-cc00-4000-a000-000000000001';

UPDATE objetivos SET fecha_limite = '2026-10-31'
  WHERE id = 'cc000007-cc00-4000-a000-000000000001';

-- Pendiente: futuro lejano
UPDATE objetivos SET fecha_limite = '2026-12-31'
  WHERE id = 'cc000008-cc00-4000-a000-000000000001';

-- ── Objetivos Martín (empleado) ────────────────────────────────
-- Completados
UPDATE objetivos SET fecha_limite = '2026-04-30'
  WHERE id = 'dd000001-dd00-4000-a000-000000000002';

UPDATE objetivos SET fecha_limite = '2026-06-30'
  WHERE id = 'dd000002-dd00-4000-a000-000000000002';

-- En progreso
UPDATE objetivos SET fecha_limite = '2026-11-30'
  WHERE id = 'dd000003-dd00-4000-a000-000000000002';

UPDATE objetivos SET fecha_limite = '2026-10-31'
  WHERE id = 'dd000004-dd00-4000-a000-000000000002';

-- Pendiente
UPDATE objetivos SET fecha_limite = '2026-12-31'
  WHERE id = 'dd000005-dd00-4000-a000-000000000002';

-- ── Avances: sumar 2 años a todos los registros viejos ────────
UPDATE objetivo_avances
   SET creado_en = creado_en + INTERVAL '2 years'
 WHERE persona_id IN (
   'aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
   'bbbbbbbb-bbbb-4bbb-bbbb-000000000002'
 )
   AND creado_en < '2026-01-01 00:00:00';

-- ── Validaciones externas: sumar 2 años ───────────────────────
UPDATE validaciones_externas
   SET creado_en = creado_en + INTERVAL '2 years'
 WHERE objetivo_id IN (
   'cc000001-cc00-4000-a000-000000000001',
   'cc000002-cc00-4000-a000-000000000001',
   'cc000003-cc00-4000-a000-000000000001',
   'cc000004-cc00-4000-a000-000000000001'
 )
   AND creado_en < '2026-01-01 00:00:00';

-- ── Cierres semanales: actualizar a la semana actual ──────────
UPDATE cierres_semanales
   SET semana    = date_trunc('week', now())::date,
       creado_en = now()
 WHERE persona_id IN (
   'aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
   'bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
   'dddddddd-dddd-4ddd-dddd-000000000003'
 );

-- ── Si Nicolás no tiene cierre semanal, crear uno ─────────────
INSERT INTO cierres_semanales (
  id, persona_id, semana,
  que_avance, que_obstaculos, que_necesito, creado_en
)
SELECT
  gen_random_uuid(),
  'aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
  date_trunc('week', now())::date,
  'Grabé los episodios 4 y 5 del canal de YouTube. El engagement del trailer superó las expectativas.',
  'El cliente del retainer quiere ajustes en el brief — hubo que replantear el enfoque.',
  'Feedback del cliente sobre el nuevo calendario de contenido antes del lunes.',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM cierres_semanales
  WHERE persona_id = 'aaaaaaaa-aaaa-4aaa-aaaa-000000000001'
    AND semana = date_trunc('week', now())::date
);

-- ── Verificación ──────────────────────────────────────────────
SELECT
  'objetivo' AS tipo,
  titulo,
  estado,
  fecha_limite::text AS fecha
FROM objetivos
WHERE persona_id IN (
  'aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
  'bbbbbbbb-bbbb-4bbb-bbbb-000000000002'
)
ORDER BY fecha_limite;
