-- Índices de performance — item 12
-- Estos índices le dicen a la base de datos cómo encontrar datos rápido
-- sin tener que leer toda la tabla fila por fila.

-- Objetivos filtrados por empresa (dashboard, analytics, reportes)
CREATE INDEX IF NOT EXISTS idx_objetivos_empresa_id
  ON objetivos(empresa_id);

-- Objetivos filtrados por persona (equipo, mi-trabajo)
CREATE INDEX IF NOT EXISTS idx_objetivos_persona_id
  ON objetivos(persona_id);

-- Avances filtrados por objetivo (el join más frecuente)
CREATE INDEX IF NOT EXISTS idx_objetivo_avances_objetivo_id
  ON objetivo_avances(objetivo_id);

-- Avances filtrados por empresa + fecha (equipo, analytics)
CREATE INDEX IF NOT EXISTS idx_objetivo_avances_empresa_creado
  ON objetivo_avances(empresa_id, creado_en DESC);

-- Personas filtradas por empresa
CREATE INDEX IF NOT EXISTS idx_personas_empresa_id
  ON personas(empresa_id);

-- Personas activas por empresa (el filtro más común)
CREATE INDEX IF NOT EXISTS idx_personas_empresa_activo
  ON personas(empresa_id, empleo_activo);

-- Cierres semanales por persona + semana
CREATE INDEX IF NOT EXISTS idx_cierres_semanales_persona_semana
  ON cierres_semanales(persona_id, semana);

-- Notificaciones por persona (campana)
CREATE INDEX IF NOT EXISTS idx_notificaciones_persona_id
  ON notificaciones(persona_id);

-- Tokens de validación (lookup por token único)
CREATE INDEX IF NOT EXISTS idx_tokens_validacion_token
  ON tokens_validacion(token);
