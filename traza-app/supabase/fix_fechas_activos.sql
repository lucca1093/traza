-- ═══════════════════════════════════════════════════════════════
-- FIX_FECHAS_ACTIVOS.SQL
-- Actualiza todos los objetivos activos vencidos a fechas futuras
-- para que el índice Traza tenga datos significativos.
-- Empresa: Grupo Meridian S.A.
-- ═══════════════════════════════════════════════════════════════

-- Objetivos 'En progreso' con fecha vencida → extender a fin de año 2026
UPDATE objetivos
SET fecha_limite = '2026-12-31'
WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
  AND estado = 'En progreso'
  AND es_continuo = false
  AND fecha_limite < CURRENT_DATE;

-- Objetivos 'Pendiente' con fecha vencida → extender a sep/dic 2026 según prioridad
UPDATE objetivos
SET fecha_limite = CASE
  WHEN prioridad = 'Alta'  THEN '2026-09-30'
  WHEN prioridad = 'Media' THEN '2026-10-31'
  ELSE '2026-12-31'
END
WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
  AND estado = 'Pendiente'
  AND es_continuo = false
  AND fecha_limite < CURRENT_DATE;

-- Verificación: mostrar cuántos activos quedan vencidos (debería ser 0)
SELECT estado, COUNT(*) AS total, SUM(CASE WHEN fecha_limite < CURRENT_DATE AND es_continuo = false THEN 1 ELSE 0 END) AS vencidos
FROM objetivos
WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
  AND estado != 'Completado'
GROUP BY estado;
