-- =============================================================
-- SEED: Grupo Meridian — demo data
-- Sin DO blocks ni dollar-quoting — SQL puro con CTEs y JOINs
-- Idempotente: se puede ejecutar varias veces sin duplicar datos
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. EMPRESA
-- ──────────────────────────────────────────────────────────────
INSERT INTO empresas (nombre, rubro)
SELECT 'Grupo Meridian', 'Consultoría'
WHERE NOT EXISTS (
  SELECT 1 FROM empresas WHERE nombre ILIKE '%meridian%'
);

-- ──────────────────────────────────────────────────────────────
-- 1. PERSONAS (11 empleados)
-- ──────────────────────────────────────────────────────────────
INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, empleo_activo)
SELECT e.id, r.nom, r.ape, r.cargo, r.area, true
FROM empresas e
CROSS JOIN (VALUES
  ('Sofía',     'Reynoso',  'Directora Comercial',    'Comercial'),
  ('Valentina', 'Cruz',     'Gerente de Ventas',       'Comercial'),
  ('Martín',    'Aguirre',  'Ejecutivo de Cuentas',    'Comercial'),
  ('Luciana',   'Ferreyra', 'Ejecutiva de Cuentas',    'Comercial'),
  ('Diego',     'Molina',   'Director de Operaciones', 'Operaciones'),
  ('Camila',    'Ortega',   'Analista de Procesos',    'Operaciones'),
  ('Gonzalo',   'Sánchez',  'Analista de Procesos',    'Operaciones'),
  ('Florencia', 'Herrera',  'Directora de RRHH',       'RRHH'),
  ('Emiliano',  'Vidal',    'Analista de RRHH',        'RRHH'),
  ('Renata',    'Paz',      'Directora de Tecnología', 'Tecnología'),
  ('Santiago',  'Ibáñez',   'Desarrollador Full Stack', 'Tecnología')
) AS r(nom, ape, cargo, area)
WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (
    SELECT 1 FROM personas p2
    WHERE p2.empresa_id = e.id
      AND p2.nombre = r.nom
      AND p2.apellido = r.ape
  );

-- Supervisores
UPDATE personas SET supervisor_id = (
  SELECT id FROM personas p2
  WHERE p2.empresa_id = personas.empresa_id
    AND p2.nombre = 'Sofía' AND p2.apellido = 'Reynoso'
)
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (nombre, apellido) IN (('Valentina','Cruz'));

UPDATE personas SET supervisor_id = (
  SELECT id FROM personas p2
  WHERE p2.empresa_id = personas.empresa_id
    AND p2.nombre = 'Valentina' AND p2.apellido = 'Cruz'
)
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (nombre, apellido) IN (('Martín','Aguirre'), ('Luciana','Ferreyra'));

UPDATE personas SET supervisor_id = (
  SELECT id FROM personas p2
  WHERE p2.empresa_id = personas.empresa_id
    AND p2.nombre = 'Diego' AND p2.apellido = 'Molina'
)
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (nombre, apellido) IN (('Camila','Ortega'), ('Gonzalo','Sánchez'));

UPDATE personas SET supervisor_id = (
  SELECT id FROM personas p2
  WHERE p2.empresa_id = personas.empresa_id
    AND p2.nombre = 'Florencia' AND p2.apellido = 'Herrera'
)
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (nombre, apellido) IN (('Emiliano','Vidal'));

UPDATE personas SET supervisor_id = (
  SELECT id FROM personas p2
  WHERE p2.empresa_id = personas.empresa_id
    AND p2.nombre = 'Renata' AND p2.apellido = 'Paz'
)
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (nombre, apellido) IN (('Santiago','Ibáñez'));

-- ──────────────────────────────────────────────────────────────
-- 2. OBJETIVOS INDIVIDUALES (18 objetivos)
-- ──────────────────────────────────────────────────────────────
INSERT INTO objetivos (empresa_id, persona_id, titulo, descripcion, prioridad, fecha_limite, estado, tipo, validacion)
SELECT
  e.id,
  p.id,
  r.titulo,
  r.descripcion,
  r.prioridad,
  r.fecha_limite::date,
  r.estado,
  'Asignado',
  r.validacion
FROM empresas e
JOIN personas p ON p.empresa_id = e.id
JOIN (VALUES
  ('Sofía',     'Reynoso',  'Expandir cartera de clientes enterprise',       'Incorporar 5 nuevas cuentas enterprise al pipeline',               'Alta',  '2025-06-30', 'Completado',  'De acuerdo'),
  ('Sofía',     'Reynoso',  'Implementar metodología de venta consultiva',    'Capacitar al equipo en SPIN Selling',                             'Media', '2025-09-30', 'En progreso', NULL),
  ('Valentina', 'Cruz',     'Alcanzar cuota trimestral Q1',                   'Llegar al 110% de la cuota asignada',                             'Alta',  '2025-03-31', 'Completado',  'De acuerdo'),
  ('Valentina', 'Cruz',     'Reducir ciclo de ventas en un 20%',              'Implementar proceso de calificación más riguroso',                'Media', '2025-09-30', 'En progreso', NULL),
  ('Martín',    'Aguirre',  'Gestionar y hacer crecer 3 cuentas clave',       'Mantener NPS mayor a 8 en las tres cuentas',                      'Alta',  '2025-12-31', 'En progreso', NULL),
  ('Martín',    'Aguirre',  'Certificarse en Salesforce Administrator',        'Obtener la certificación oficial de Salesforce',                  'Media', '2025-06-30', 'Completado',  'De acuerdo'),
  ('Luciana',   'Ferreyra', 'Prospectar 50 leads calificados por mes',         'Mantener el funnel con 50 leads MQL mensuales',                   'Alta',  '2025-12-31', 'En progreso', NULL),
  ('Luciana',   'Ferreyra', 'Mejorar tasa de conversión de propuestas',       'Subir del 28% al 40% la tasa de cierre',                         'Alta',  '2025-09-30', 'Pendiente',   NULL),
  ('Diego',     'Molina',   'Reducir tiempos de entrega en un 15%',           'Rediseñar workflow de despacho',                                  'Alta',  '2025-06-30', 'Completado',  'De acuerdo'),
  ('Diego',     'Molina',   'Certificar procesos bajo ISO 9001',              'Preparar documentación y auditoría interna',                      'Alta',  '2025-12-31', 'En progreso', NULL),
  ('Camila',    'Ortega',   'Mapear y documentar procesos críticos',          'Documentar 12 procesos core del área',                            'Media', '2025-09-30', 'En progreso', NULL),
  ('Gonzalo',   'Sánchez',  'Automatizar reportes operativos semanales',      'Eliminar trabajo manual en generación de reportes',               'Media', '2025-06-30', 'Completado',  'Parcialmente de acuerdo'),
  ('Florencia', 'Herrera',  'Implementar proceso de onboarding estructurado', 'Crear programa de inducción de 30-60-90 días',                    'Alta',  '2025-06-30', 'Completado',  'De acuerdo'),
  ('Florencia', 'Herrera',  'Lanzar programa de desarrollo de liderazgo',     'Diseñar e implementar track de líderes potenciales',              'Alta',  '2025-12-31', 'En progreso', NULL),
  ('Emiliano',  'Vidal',    'Reducir rotación voluntaria al 8% anual',        'Identificar causas y diseñar plan de retención',                  'Alta',  '2025-12-31', 'En progreso', NULL),
  ('Renata',    'Paz',      'Migrar infraestructura a Kubernetes',            'Migrar todos los servicios a orquestación con K8s',               'Alta',  '2025-09-30', 'En progreso', NULL),
  ('Renata',    'Paz',      'Reducir deuda técnica en un 30%',                'Refactorizar módulos legacy identificados',                       'Media', '2025-12-31', 'Pendiente',   NULL),
  ('Santiago',  'Ibáñez',   'Implementar cobertura de tests al 80%',         'Alcanzar 80% de coverage en el codebase principal',               'Media', '2025-09-30', 'En progreso', NULL)
) AS r(pnom, pape, titulo, descripcion, prioridad, fecha_limite, estado, validacion)
  ON p.nombre = r.pnom AND p.apellido = r.pape
WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (
    SELECT 1 FROM objetivos o2
    WHERE o2.empresa_id = e.id
      AND o2.persona_id = p.id
      AND o2.titulo = r.titulo
      AND o2.grupo_id IS NULL
  );

-- ──────────────────────────────────────────────────────────────
-- 3. AVANCES en objetivos individuales
-- creado_por: usa el primer profile disponible (admin del sistema)
-- ──────────────────────────────────────────────────────────────
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en)
SELECT
  e.id,
  o.id,
  p.id,
  'comentario',
  r.contenido,
  (SELECT id FROM profiles WHERE empresa_id = e.id LIMIT 1),
  r.creado_en::timestamptz
FROM empresas e
JOIN personas p ON p.empresa_id = e.id
JOIN objetivos o ON o.empresa_id = e.id AND o.persona_id = p.id AND o.grupo_id IS NULL
JOIN (VALUES
  ('Sofía',     'Reynoso',  'Expandir cartera de clientes enterprise',        'Cerramos las cuentas de Tenaris y Arcor. Pipeline con 3 más en negociación.',               '2025-04-10 10:00:00'),
  ('Valentina', 'Cruz',     'Alcanzar cuota trimestral Q1',                   'Terminamos Q1 al 112%. Récord del equipo.',                                                   '2025-04-02 09:30:00'),
  ('Martín',    'Aguirre',  'Certificarse en Salesforce Administrator',        'Rendí el examen la semana pasada. Aprobado con 87/100.',                                     '2025-05-15 14:00:00'),
  ('Diego',     'Molina',   'Reducir tiempos de entrega en un 15%',           'Logramos -17% en los últimos 3 meses. Superamos el objetivo.',                               '2025-05-20 11:00:00'),
  ('Gonzalo',   'Sánchez',  'Automatizar reportes operativos semanales',      'Primer reporte automático entregado. Faltaron algunos KPIs del área de logística.',          '2025-04-25 16:00:00'),
  ('Florencia', 'Herrera',  'Implementar proceso de onboarding estructurado', 'Primeros 2 ingresos pasaron por el programa completo. Feedback muy positivo.',              '2025-05-05 10:30:00'),
  ('Luciana',   'Ferreyra', 'Prospectar 50 leads calificados por mes',         'Mes 1: 47 leads. Mes 2: 52 leads. Tendencia positiva.',                                      '2025-04-18 12:00:00'),
  ('Renata',    'Paz',      'Migrar infraestructura a Kubernetes',            'Migramos los primeros 4 servicios. Restan 6 más. Todo sin downtime hasta ahora.',            '2025-05-28 15:00:00'),
  ('Santiago',  'Ibáñez',   'Implementar cobertura de tests al 80%',         'Pasamos de 41% a 63% de coverage en 6 semanas. Ritmo bueno.',                                '2025-05-30 17:00:00')
) AS r(pnom, pape, titulo, contenido, creado_en)
  ON p.nombre = r.pnom AND p.apellido = r.pape AND o.titulo = r.titulo
WHERE e.nombre ILIKE '%meridian%'
  AND (SELECT id FROM profiles WHERE empresa_id = e.id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM objetivo_avances av
    WHERE av.objetivo_id = o.id
      AND av.contenido = r.contenido
  );

-- ──────────────────────────────────────────────────────────────
-- 4. GRUPOS (insertar primero, luego sus objetivos por separado)
-- ──────────────────────────────────────────────────────────────

-- Grupo 1: Equipo Comercial Q2
INSERT INTO objetivo_grupos (empresa_id, titulo, descripcion, prioridad, tipo, es_continuo, fecha_limite)
SELECT e.id, 'Plan comercial Q2 2025', 'Alinear al equipo comercial en los objetivos del segundo trimestre', 'Alta', 'equipo', false, '2025-06-30'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM objetivo_grupos g WHERE g.empresa_id = e.id AND g.titulo = 'Plan comercial Q2 2025');

-- Grupo 2: Lean Operaciones
INSERT INTO objetivo_grupos (empresa_id, titulo, descripcion, prioridad, tipo, es_continuo, fecha_limite)
SELECT e.id, 'Transformación Lean en Operaciones', 'Adoptar metodología Lean en todos los procesos del área', 'Alta', 'equipo', false, '2025-12-31'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM objetivo_grupos g WHERE g.empresa_id = e.id AND g.titulo = 'Transformación Lean en Operaciones');

-- Grupo 3: Clima RRHH (por área)
INSERT INTO objetivo_grupos (empresa_id, titulo, descripcion, prioridad, tipo, area_nombre, es_continuo, fecha_limite)
SELECT e.id, 'Clima organizacional 2025', 'Medir y mejorar el clima organizacional de la empresa', 'Media', 'area', 'RRHH', false, '2025-12-31'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM objetivo_grupos g WHERE g.empresa_id = e.id AND g.titulo = 'Clima organizacional 2025');

-- Grupo 4: Assessment externo Korn Ferry
INSERT INTO objetivo_grupos (empresa_id, titulo, descripcion, prioridad, tipo, es_continuo, fecha_limite)
SELECT e.id, 'Assessment ejecutivo con Korn Ferry', 'Evaluación 360 de directores con consultora Korn Ferry', 'Alta', 'externo', false, '2025-09-30'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM objetivo_grupos g WHERE g.empresa_id = e.id AND g.titulo = 'Assessment ejecutivo con Korn Ferry');

-- ──────────────────────────────────────────────────────────────
-- 5. OBJETIVOS GRUPALES
-- ──────────────────────────────────────────────────────────────

-- Objetivos para Grupo 1 (Comercial)
INSERT INTO objetivos (empresa_id, grupo_id, persona_id, titulo, descripcion, prioridad, fecha_limite, estado, tipo)
SELECT g.empresa_id, g.id, p.id,
  'Plan comercial Q2 2025',
  'Alinear al equipo comercial en los objetivos del segundo trimestre',
  'Alta', '2025-06-30', 'En progreso', 'Asignado'
FROM objetivo_grupos g
JOIN personas p ON p.empresa_id = g.empresa_id
WHERE g.titulo = 'Plan comercial Q2 2025'
  AND g.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (p.nombre, p.apellido) IN (
    ('Sofía','Reynoso'), ('Valentina','Cruz'), ('Martín','Aguirre'), ('Luciana','Ferreyra')
  )
  AND NOT EXISTS (
    SELECT 1 FROM objetivos o WHERE o.grupo_id = g.id AND o.persona_id = p.id
  );

-- Objetivos para Grupo 2 (Operaciones Lean)
INSERT INTO objetivos (empresa_id, grupo_id, persona_id, titulo, descripcion, prioridad, fecha_limite, estado, tipo)
SELECT g.empresa_id, g.id, p.id,
  'Transformación Lean en Operaciones',
  'Adoptar metodología Lean en todos los procesos del área',
  'Alta', '2025-12-31', 'En progreso', 'Asignado'
FROM objetivo_grupos g
JOIN personas p ON p.empresa_id = g.empresa_id
WHERE g.titulo = 'Transformación Lean en Operaciones'
  AND g.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (p.nombre, p.apellido) IN (
    ('Diego','Molina'), ('Camila','Ortega'), ('Gonzalo','Sánchez')
  )
  AND NOT EXISTS (
    SELECT 1 FROM objetivos o WHERE o.grupo_id = g.id AND o.persona_id = p.id
  );

-- Objetivos para Grupo 3 (Clima RRHH)
INSERT INTO objetivos (empresa_id, grupo_id, persona_id, titulo, descripcion, prioridad, fecha_limite, estado, tipo)
SELECT g.empresa_id, g.id, p.id,
  'Clima organizacional 2025',
  'Medir y mejorar el clima organizacional de la empresa',
  'Media', '2025-12-31', 'En progreso', 'Asignado'
FROM objetivo_grupos g
JOIN personas p ON p.empresa_id = g.empresa_id
WHERE g.titulo = 'Clima organizacional 2025'
  AND g.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (p.nombre, p.apellido) IN (
    ('Florencia','Herrera'), ('Emiliano','Vidal')
  )
  AND NOT EXISTS (
    SELECT 1 FROM objetivos o WHERE o.grupo_id = g.id AND o.persona_id = p.id
  );

-- Objetivos para Grupo 4 (Korn Ferry — internos)
INSERT INTO objetivos (empresa_id, grupo_id, persona_id, titulo, descripcion, prioridad, fecha_limite, estado, tipo)
SELECT g.empresa_id, g.id, p.id,
  'Assessment ejecutivo con Korn Ferry',
  'Evaluación 360 de directores con consultora Korn Ferry',
  'Alta', '2025-09-30', 'Pendiente', 'Asignado'
FROM objetivo_grupos g
JOIN personas p ON p.empresa_id = g.empresa_id
WHERE g.titulo = 'Assessment ejecutivo con Korn Ferry'
  AND g.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND (p.nombre, p.apellido) IN (
    ('Sofía','Reynoso'), ('Diego','Molina'), ('Florencia','Herrera'), ('Renata','Paz')
  )
  AND NOT EXISTS (
    SELECT 1 FROM objetivos o WHERE o.grupo_id = g.id AND o.persona_id = p.id
  );

-- ──────────────────────────────────────────────────────────────
-- 6. OBJETIVO EXTERNO (colaborador de Korn Ferry)
-- ──────────────────────────────────────────────────────────────
INSERT INTO objetivo_externos (grupo_id, empresa_id, nombre, empresa_nombre, email)
SELECT g.id, g.empresa_id, 'Ana Kessler', 'Korn Ferry', 'akessler@kornferry.com'
FROM objetivo_grupos g
WHERE g.titulo = 'Assessment ejecutivo con Korn Ferry'
  AND g.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND NOT EXISTS (
    SELECT 1 FROM objetivo_externos ex WHERE ex.grupo_id = g.id AND ex.nombre = 'Ana Kessler'
  );

-- ──────────────────────────────────────────────────────────────
-- 7. PERÍODOS DE EVALUACIÓN — 6 cerrados + 1 activo
-- ──────────────────────────────────────────────────────────────

-- Anual 2023
INSERT INTO periodos_evaluacion (empresa_id, nombre, tipo, fecha_inicio, fecha_fin, estado, cerrado_en)
SELECT e.id, 'Anual 2023', 'anual', '2023-01-01', '2023-12-31', 'cerrado', '2024-01-15 10:00:00'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM periodos_evaluacion WHERE empresa_id = e.id AND nombre = 'Anual 2023');

INSERT INTO resumen_periodo_empleado (periodo_id, empresa_id, persona_id, score, total_objetivos, completados, cumplimiento, validados, parciales, rechazados, estado_general)
SELECT pe.id, pe.empresa_id, p.id, r.score, r.total, r.comp, r.cumpl, r.val, r.par, r.rec, r.estado
FROM periodos_evaluacion pe
CROSS JOIN (VALUES
  ('Sofía',     'Reynoso',  82, 4, 3, 75.0, 3, 0, 1, 'Cumplió parcialmente'),
  ('Valentina', 'Cruz',     88, 4, 4, 100.0, 4, 0, 0, 'Cumplió'),
  ('Martín',    'Aguirre',  74, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Luciana',   'Ferreyra', 70, 3, 2, 66.7, 1, 1, 1, 'Cumplió parcialmente'),
  ('Diego',     'Molina',   85, 4, 3, 75.0, 3, 0, 1, 'Cumplió parcialmente'),
  ('Camila',    'Ortega',   78, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Gonzalo',   'Sánchez',  72, 3, 2, 66.7, 2, 0, 1, 'Cumplió parcialmente'),
  ('Florencia', 'Herrera',  90, 4, 4, 100.0, 4, 0, 0, 'Cumplió'),
  ('Emiliano',  'Vidal',    68, 3, 2, 66.7, 1, 1, 1, 'Cumplió parcialmente'),
  ('Renata',    'Paz',      86, 4, 3, 75.0, 3, 1, 0, 'Cumplió'),
  ('Santiago',  'Ibáñez',   75, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente')
) AS r(pnom, pape, score, total, comp, cumpl, val, par, rec, estado)
JOIN personas p ON p.empresa_id = pe.empresa_id AND p.nombre = r.pnom AND p.apellido = r.pape
WHERE pe.nombre = 'Anual 2023'
  AND pe.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND NOT EXISTS (SELECT 1 FROM resumen_periodo_empleado rpe WHERE rpe.periodo_id = pe.id AND rpe.persona_id = p.id);

-- Q1 2024
INSERT INTO periodos_evaluacion (empresa_id, nombre, tipo, fecha_inicio, fecha_fin, estado, cerrado_en)
SELECT e.id, 'Q1 2024', 'trimestral', '2024-01-01', '2024-03-31', 'cerrado', '2024-04-05 10:00:00'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM periodos_evaluacion WHERE empresa_id = e.id AND nombre = 'Q1 2024');

INSERT INTO resumen_periodo_empleado (periodo_id, empresa_id, persona_id, score, total_objetivos, completados, cumplimiento, validados, parciales, rechazados, estado_general)
SELECT pe.id, pe.empresa_id, p.id, r.score, r.total, r.comp, r.cumpl, r.val, r.par, r.rec, r.estado
FROM periodos_evaluacion pe
CROSS JOIN (VALUES
  ('Sofía',     'Reynoso',  79, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Valentina', 'Cruz',     91, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Martín',    'Aguirre',  76, 3, 2, 66.7, 2, 0, 1, 'Cumplió parcialmente'),
  ('Luciana',   'Ferreyra', 73, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Diego',     'Molina',   88, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Camila',    'Ortega',   74, 3, 2, 66.7, 2, 0, 1, 'Cumplió parcialmente'),
  ('Gonzalo',   'Sánchez',  80, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Florencia', 'Herrera',  85, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Emiliano',  'Vidal',    71, 3, 2, 66.7, 1, 1, 1, 'Cumplió parcialmente'),
  ('Renata',    'Paz',      82, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Santiago',  'Ibáñez',   77, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente')
) AS r(pnom, pape, score, total, comp, cumpl, val, par, rec, estado)
JOIN personas p ON p.empresa_id = pe.empresa_id AND p.nombre = r.pnom AND p.apellido = r.pape
WHERE pe.nombre = 'Q1 2024'
  AND pe.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND NOT EXISTS (SELECT 1 FROM resumen_periodo_empleado rpe WHERE rpe.periodo_id = pe.id AND rpe.persona_id = p.id);

-- Q2 2024
INSERT INTO periodos_evaluacion (empresa_id, nombre, tipo, fecha_inicio, fecha_fin, estado, cerrado_en)
SELECT e.id, 'Q2 2024', 'trimestral', '2024-04-01', '2024-06-30', 'cerrado', '2024-07-05 10:00:00'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM periodos_evaluacion WHERE empresa_id = e.id AND nombre = 'Q2 2024');

INSERT INTO resumen_periodo_empleado (periodo_id, empresa_id, persona_id, score, total_objetivos, completados, cumplimiento, validados, parciales, rechazados, estado_general)
SELECT pe.id, pe.empresa_id, p.id, r.score, r.total, r.comp, r.cumpl, r.val, r.par, r.rec, r.estado
FROM periodos_evaluacion pe
CROSS JOIN (VALUES
  ('Sofía',     'Reynoso',  86, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Valentina', 'Cruz',     89, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Martín',    'Aguirre',  80, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Luciana',   'Ferreyra', 77, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Diego',     'Molina',   91, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Camila',    'Ortega',   78, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Gonzalo',   'Sánchez',  82, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Florencia', 'Herrera',  94, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Emiliano',  'Vidal',    70, 3, 2, 66.7, 1, 1, 1, 'Cumplió parcialmente'),
  ('Renata',    'Paz',      88, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Santiago',  'Ibáñez',   80, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente')
) AS r(pnom, pape, score, total, comp, cumpl, val, par, rec, estado)
JOIN personas p ON p.empresa_id = pe.empresa_id AND p.nombre = r.pnom AND p.apellido = r.pape
WHERE pe.nombre = 'Q2 2024'
  AND pe.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND NOT EXISTS (SELECT 1 FROM resumen_periodo_empleado rpe WHERE rpe.periodo_id = pe.id AND rpe.persona_id = p.id);

-- H1 2024
INSERT INTO periodos_evaluacion (empresa_id, nombre, tipo, fecha_inicio, fecha_fin, estado, cerrado_en)
SELECT e.id, 'H1 2024', 'semestral', '2024-01-01', '2024-06-30', 'cerrado', '2024-07-10 10:00:00'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM periodos_evaluacion WHERE empresa_id = e.id AND nombre = 'H1 2024');

INSERT INTO resumen_periodo_empleado (periodo_id, empresa_id, persona_id, score, total_objetivos, completados, cumplimiento, validados, parciales, rechazados, estado_general)
SELECT pe.id, pe.empresa_id, p.id, r.score, r.total, r.comp, r.cumpl, r.val, r.par, r.rec, r.estado
FROM periodos_evaluacion pe
CROSS JOIN (VALUES
  ('Sofía',     'Reynoso',  84, 5, 4, 80.0, 4, 1, 0, 'Cumplió'),
  ('Valentina', 'Cruz',     93, 5, 5, 100.0, 5, 0, 0, 'Cumplió'),
  ('Martín',    'Aguirre',  78, 4, 3, 75.0, 3, 1, 0, 'Cumplió parcialmente'),
  ('Luciana',   'Ferreyra', 75, 4, 3, 75.0, 2, 1, 1, 'Cumplió parcialmente'),
  ('Diego',     'Molina',   89, 5, 4, 80.0, 4, 1, 0, 'Cumplió'),
  ('Camila',    'Ortega',   76, 4, 3, 75.0, 3, 0, 1, 'Cumplió parcialmente'),
  ('Gonzalo',   'Sánchez',  81, 4, 3, 75.0, 3, 1, 0, 'Cumplió parcialmente'),
  ('Florencia', 'Herrera',  92, 5, 5, 100.0, 5, 0, 0, 'Cumplió'),
  ('Emiliano',  'Vidal',    69, 4, 2, 50.0, 2, 1, 1, 'Cumplió parcialmente'),
  ('Renata',    'Paz',      87, 5, 4, 80.0, 4, 1, 0, 'Cumplió'),
  ('Santiago',  'Ibáñez',   79, 4, 3, 75.0, 3, 1, 0, 'Cumplió parcialmente')
) AS r(pnom, pape, score, total, comp, cumpl, val, par, rec, estado)
JOIN personas p ON p.empresa_id = pe.empresa_id AND p.nombre = r.pnom AND p.apellido = r.pape
WHERE pe.nombre = 'H1 2024'
  AND pe.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND NOT EXISTS (SELECT 1 FROM resumen_periodo_empleado rpe WHERE rpe.periodo_id = pe.id AND rpe.persona_id = p.id);

-- Q3 2024
INSERT INTO periodos_evaluacion (empresa_id, nombre, tipo, fecha_inicio, fecha_fin, estado, cerrado_en)
SELECT e.id, 'Q3 2024', 'trimestral', '2024-07-01', '2024-09-30', 'cerrado', '2024-10-05 10:00:00'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM periodos_evaluacion WHERE empresa_id = e.id AND nombre = 'Q3 2024');

INSERT INTO resumen_periodo_empleado (periodo_id, empresa_id, persona_id, score, total_objetivos, completados, cumplimiento, validados, parciales, rechazados, estado_general)
SELECT pe.id, pe.empresa_id, p.id, r.score, r.total, r.comp, r.cumpl, r.val, r.par, r.rec, r.estado
FROM periodos_evaluacion pe
CROSS JOIN (VALUES
  ('Sofía',     'Reynoso',  83, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Valentina', 'Cruz',     90, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Martín',    'Aguirre',  77, 3, 2, 66.7, 2, 0, 1, 'Cumplió parcialmente'),
  ('Luciana',   'Ferreyra', 74, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Diego',     'Molina',   87, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Camila',    'Ortega',   75, 3, 2, 66.7, 2, 0, 1, 'Cumplió parcialmente'),
  ('Gonzalo',   'Sánchez',  83, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Florencia', 'Herrera',  91, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Emiliano',  'Vidal',    72, 3, 2, 66.7, 2, 0, 1, 'Cumplió parcialmente'),
  ('Renata',    'Paz',      85, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Santiago',  'Ibáñez',   78, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente')
) AS r(pnom, pape, score, total, comp, cumpl, val, par, rec, estado)
JOIN personas p ON p.empresa_id = pe.empresa_id AND p.nombre = r.pnom AND p.apellido = r.pape
WHERE pe.nombre = 'Q3 2024'
  AND pe.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND NOT EXISTS (SELECT 1 FROM resumen_periodo_empleado rpe WHERE rpe.periodo_id = pe.id AND rpe.persona_id = p.id);

-- Q4 2024
INSERT INTO periodos_evaluacion (empresa_id, nombre, tipo, fecha_inicio, fecha_fin, estado, cerrado_en)
SELECT e.id, 'Q4 2024', 'trimestral', '2024-10-01', '2024-12-31', 'cerrado', '2025-01-08 10:00:00'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM periodos_evaluacion WHERE empresa_id = e.id AND nombre = 'Q4 2024');

INSERT INTO resumen_periodo_empleado (periodo_id, empresa_id, persona_id, score, total_objetivos, completados, cumplimiento, validados, parciales, rechazados, estado_general)
SELECT pe.id, pe.empresa_id, p.id, r.score, r.total, r.comp, r.cumpl, r.val, r.par, r.rec, r.estado
FROM periodos_evaluacion pe
CROSS JOIN (VALUES
  ('Sofía',     'Reynoso',  87, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Valentina', 'Cruz',     92, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Martín',    'Aguirre',  81, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Luciana',   'Ferreyra', 78, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Diego',     'Molina',   90, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Camila',    'Ortega',   79, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente'),
  ('Gonzalo',   'Sánchez',  84, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Florencia', 'Herrera',  93, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Emiliano',  'Vidal',    73, 3, 2, 66.7, 2, 0, 1, 'Cumplió parcialmente'),
  ('Renata',    'Paz',      89, 3, 3, 100.0, 3, 0, 0, 'Cumplió'),
  ('Santiago',  'Ibáñez',   82, 3, 2, 66.7, 2, 1, 0, 'Cumplió parcialmente')
) AS r(pnom, pape, score, total, comp, cumpl, val, par, rec, estado)
JOIN personas p ON p.empresa_id = pe.empresa_id AND p.nombre = r.pnom AND p.apellido = r.pape
WHERE pe.nombre = 'Q4 2024'
  AND pe.empresa_id = (SELECT id FROM empresas WHERE nombre ILIKE '%meridian%')
  AND NOT EXISTS (SELECT 1 FROM resumen_periodo_empleado rpe WHERE rpe.periodo_id = pe.id AND rpe.persona_id = p.id);

-- Q1 2025 — ACTIVO (sin resúmenes aún)
INSERT INTO periodos_evaluacion (empresa_id, nombre, tipo, fecha_inicio, fecha_fin, estado)
SELECT e.id, 'Q1 2025', 'trimestral', '2025-01-01', '2025-03-31', 'abierto'
FROM empresas e WHERE e.nombre ILIKE '%meridian%'
  AND NOT EXISTS (SELECT 1 FROM periodos_evaluacion WHERE empresa_id = e.id AND nombre = 'Q1 2025');
