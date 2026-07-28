-- Historial de fechas — item 13
-- Agrega la fecha exacta en que cada objetivo fue marcado como completado.

ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS completado_en timestamptz;
