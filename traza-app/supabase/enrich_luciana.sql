-- ═══════════════════════════════════════════════════════════════
-- ENRICH_LUCIANA.SQL
-- Agrega objetivos, avances y cierres semanales para Luciana Ferreyra
-- Correr en Supabase SQL Editor (sin bloques DO $)
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. NUEVOS OBJETIVOS
-- ──────────────────────────────────────────────────────────────

-- Objetivo: plan fidelización (Completado, para que supervisor valide)
INSERT INTO objetivos
  (empresa_id, persona_id, creado_por, titulo, descripcion, prioridad, categoria, es_continuo, fecha_limite, estado, tipo, autoevaluacion, comentario_empleado)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1),
  'Desarrollar plan de fidelización de clientes',
  'Crear e implementar un programa de loyalty para los 20 clientes top de la cartera comercial',
  'Alta', 'Resultado', false, '2025-11-30', 'Completado', 'Asignado',
  'Cumplido',
  'Logré implementar el programa para 18 de los 20 clientes top. Los dos restantes quedaron postergados por cambios en su estructura interna. El NPS subió 12 puntos.'
WHERE NOT EXISTS (
  SELECT 1 FROM objetivos
  WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
    AND titulo = 'Desarrollar plan de fidelización de clientes'
);

-- Objetivo: capacitación negociación (Completado, con validación parcial del supervisor)
INSERT INTO objetivos
  (empresa_id, persona_id, creado_por, titulo, descripcion, prioridad, categoria, es_continuo, fecha_limite, estado, tipo, autoevaluacion, comentario_empleado, validacion, validado_por, comentario_supervisor)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1),
  'Capacitarse en negociación avanzada',
  'Completar el curso de negociación de Harvard Online (8 semanas) y aplicar 2 técnicas en reuniones reales',
  'Media', 'Aprendizaje', false, '2025-08-31', 'Completado', 'Asignado',
  'Cumplido',
  'Completé el curso y apliqué las técnicas de anclaje y BATNA en tres cierres. Los resultados fueron muy positivos.',
  'Parcialmente de acuerdo',
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1),
  'El curso fue completado, pero aún necesito ver más consistencia en la aplicación práctica de las técnicas en cierres complejos. En los casos observados la aplicación fue correcta.'
WHERE NOT EXISTS (
  SELECT 1 FROM objetivos
  WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
    AND titulo = 'Capacitarse en negociación avanzada'
);

-- Objetivo: hábito diario en CRM (activo, continuo)
INSERT INTO objetivos
  (empresa_id, persona_id, creado_por, titulo, descripcion, prioridad, categoria, es_continuo, fecha_limite, estado, tipo)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1),
  'Actualizar CRM todos los días hábiles',
  'Registrar todas las actividades comerciales en el CRM el mismo día, sin excepciones',
  'Media', 'Hábito', true, NULL, 'En progreso', 'Asignado'
WHERE NOT EXISTS (
  SELECT 1 FROM objetivos
  WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
    AND titulo = 'Actualizar CRM todos los días hábiles'
);

-- ──────────────────────────────────────────────────────────────
-- 2. AVANCES EXTRA PARA "Prospectar 50 leads"
-- ──────────────────────────────────────────────────────────────

INSERT INTO objetivo_avances
  (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respondido_por, respondido_en, respuesta_supervisor)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM objetivos
   WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
     AND titulo = 'Prospectar 50 leads calificados por mes' LIMIT 1),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  r.tipo, r.contenido,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1),
  r.creado_en::timestamptz,
  r.estado_revision,
  CASE WHEN r.respuesta IS NOT NULL THEN (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1) ELSE NULL END,
  CASE WHEN r.respuesta IS NOT NULL THEN (r.creado_en::timestamptz + interval '6 hours') ELSE NULL END,
  r.respuesta
FROM (VALUES
  ('comentario', 'Mes 3: 54 leads generados, por encima del objetivo. Usé LinkedIn Sales Navigator para mejorar la segmentación.', '2025-05-20 10:30:00', 'aprobado', 'Excelente. El uso de Sales Navigator es exactamente lo que esperábamos. Seguí así.'),
  ('comentario', 'Mes 4: 48 leads. Dos semanas tuve baja performance por la feria sectorial donde no se podía prospectar. Estoy compensando.', '2025-06-18 15:00:00', 'a_revisar', 'Entiendo el contexto de la feria, pero 48 es por debajo del objetivo. Necesito que el mes 5 compense claramente. ¿Tenés un plan?'),
  ('comentario', 'Mes 5: 61 leads, compensé el mes anterior y llegué al acumulado. Ajusté la cadencia de outreach.', '2025-07-16 09:00:00', 'aprobado', 'Perfecto, así se hace. El acumulado está bien. Cerramos el trimestre positivos.')
) AS r(tipo, contenido, creado_en, estado_revision, respuesta)
WHERE NOT EXISTS (
  SELECT 1 FROM objetivo_avances oa
  WHERE oa.objetivo_id = (SELECT id FROM objetivos
    WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
      AND titulo = 'Prospectar 50 leads calificados por mes' LIMIT 1)
    AND oa.contenido = r.contenido
);

-- ──────────────────────────────────────────────────────────────
-- 3. AVANCES EXTRA PARA "Mejorar tasa de conversión"
-- ──────────────────────────────────────────────────────────────

INSERT INTO objetivo_avances
  (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respondido_por, respondido_en, respuesta_supervisor)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM objetivos
   WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
     AND titulo = 'Mejorar tasa de conversión de propuestas' LIMIT 1),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  r.tipo, r.contenido,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1),
  r.creado_en::timestamptz,
  r.estado_revision,
  CASE WHEN r.respuesta IS NOT NULL THEN (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1) ELSE NULL END,
  CASE WHEN r.respuesta IS NOT NULL THEN (r.creado_en::timestamptz + interval '4 hours') ELSE NULL END,
  r.respuesta
FROM (VALUES
  ('comentario', 'Tasa actual: 31%. Cerré 4 de 13 propuestas. Identifiqué que el principal freno es el precio, no el producto. Estoy trabajando en un deck de ROI más sólido.', '2025-05-10 11:00:00', 'visto', NULL),
  ('comentario', 'Presenté el nuevo deck de ROI en 3 demos. Dos de esas oportunidades avanzaron a negociación. Tasa subió a 34%.', '2025-06-05 14:30:00', 'aprobado', 'Buen progreso. El deck de ROI es lo que faltaba. ¿Podés compartirlo con el resto del equipo?'),
  ('link', 'https://docs.google.com/presentation/d/ejemplo-deck-roi', '2025-06-05 14:35:00', 'aprobado', NULL),
  ('comentario', 'Tasa de conversión: 37% este mes. Estoy a 3 puntos del objetivo. El ROI deck funcionó en 6 de 8 demos donde lo usé.', '2025-07-03 10:00:00', 'sin_revisar', NULL)
) AS r(tipo, contenido, creado_en, estado_revision, respuesta)
WHERE NOT EXISTS (
  SELECT 1 FROM objetivo_avances oa
  WHERE oa.objetivo_id = (SELECT id FROM objetivos
    WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
      AND titulo = 'Mejorar tasa de conversión de propuestas' LIMIT 1)
    AND oa.contenido = r.contenido
);

-- ──────────────────────────────────────────────────────────────
-- 4. AVANCES PARA "Plan fidelización" (nuevo objetivo)
-- ──────────────────────────────────────────────────────────────

INSERT INTO objetivo_avances
  (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respondido_por, respondido_en, respuesta_supervisor)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM objetivos
   WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
     AND titulo = 'Desarrollar plan de fidelización de clientes' LIMIT 1),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  r.tipo, r.contenido,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1),
  r.creado_en::timestamptz,
  r.estado_revision,
  CASE WHEN r.respuesta IS NOT NULL THEN (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1) ELSE NULL END,
  CASE WHEN r.respuesta IS NOT NULL THEN (r.creado_en::timestamptz + interval '3 hours') ELSE NULL END,
  r.respuesta
FROM (VALUES
  ('comentario', 'Mapeé los 20 clientes top y segmenté por valor de contrato anual. Los clasifiqué en 3 tiers para definir beneficios diferenciados.', '2025-07-25 09:00:00', 'aprobado', 'Muy buen arranque. El criterio de segmentación es el correcto. Avanzá con la propuesta de beneficios.'),
  ('comentario', 'Propuesta de beneficios lista: Tier 1 recibe acceso anticipado a nuevas funcionalidades + reunión trimestral con producto. Tier 2 y 3 tienen descuentos escalonados.', '2025-08-20 14:00:00', 'aprobado', 'Me gusta el enfoque. Aprobado para piloto. Implementá con los 5 clientes Tier 1 primero.'),
  ('comentario', 'Piloto en los 5 clientes Tier 1 completado. Todos aceptaron el programa. NPS promedio subió de 42 a 54. Expandiendo al resto.', '2025-10-15 11:00:00', 'aprobado', 'Excelente resultado. 12 puntos de NPS es muy significativo. Este programa se va a convertir en estándar para toda la cartera.'),
  ('comentario', 'Programa implementado en 18 de 20 clientes. Los 2 restantes tienen cambios internos en curso; los sumamos en Q1 2026. Objetivo cumplido.', '2025-11-28 16:00:00', 'visto', NULL)
) AS r(tipo, contenido, creado_en, estado_revision, respuesta)
WHERE NOT EXISTS (
  SELECT 1 FROM objetivo_avances oa
  WHERE oa.objetivo_id = (SELECT id FROM objetivos
    WHERE persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
      AND titulo = 'Desarrollar plan de fidelización de clientes' LIMIT 1)
    AND oa.contenido = r.contenido
);

-- ──────────────────────────────────────────────────────────────
-- 5. CIERRES SEMANALES DE LUCIANA
-- ──────────────────────────────────────────────────────────────

INSERT INTO cierres_semanales
  (empresa_id, persona_id, semana, que_avance, que_obstaculos, que_necesito, creado_por)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  r.semana::date,
  r.que_avance, r.que_obstaculos, r.que_necesito,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
FROM (VALUES
  (
    '2025-05-19',
    'Cerré 2 propuestas que estaban en negociación desde hace 3 semanas. Sumé 54 leads al funnel.',
    'Uno de los cierres tardó más de lo esperado porque el cliente pedía condiciones de pago que están fuera de nuestro estándar.',
    'Necesito claridad sobre si podemos ofrecer pagos en 6 cuotas para cuentas Tier 1. Esto desbloqueó una negociación hoy y puede haber más casos.'
  ),
  (
    '2025-06-09',
    'Presenté el deck de ROI en 3 demos. Dos avanzaron a propuesta formal. Tasa de conversión subió a 34%.',
    'El deck de ROI es efectivo pero requiere mucha personalización por cliente. Me lleva 2 horas por presentación.',
    'Sería ideal tener un template más rápido de personalizar. ¿Podría trabajar con Marketing en eso?'
  ),
  (
    '2025-07-07',
    'Inicié el piloto del programa de fidelización con los 3 primeros clientes Tier 1. Todos reaccionaron positivamente.',
    'Dos clientes no sabían que éramos una empresa de tecnología y no solo un proveedor de servicio. Hay un gap de branding.',
    'Reunión con Marketing para alinear el posicionamiento de la empresa ante los clientes. Esto impacta los cierres también.'
  ),
  (
    '2025-07-28',
    'Cerré el mejor mes del año: 61 leads y 37% de conversión. Superé el objetivo mensual por primera vez.',
    'Ningún obstáculo mayor. El equipo estuvo muy coordinado esta semana.',
    'Me gustaría explorar si podemos escalar el modelo de outreach con alguna herramienta de automatización.'
  ),
  (
    '2025-10-20',
    'Programa de fidelización activo en 12 clientes. NPS promedio ya subió 8 puntos respecto al baseline.',
    'Un cliente Tier 2 reclamó que no recibió los mismos beneficios que el Tier 1. Hay que comunicar mejor los tiers.',
    'Necesito apoyo de Diego para redactar la comunicación oficial del programa hacia los clientes.'
  )
) AS r(semana, que_avance, que_obstaculos, que_necesito)
WHERE NOT EXISTS (
  SELECT 1 FROM cierres_semanales cs
  WHERE cs.persona_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
    AND cs.semana = r.semana::date
);
