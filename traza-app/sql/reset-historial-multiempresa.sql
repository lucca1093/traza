-- ============================================================
-- PASO 1: Limpiar datos históricos mal insertados
-- ============================================================
DELETE FROM objetivos WHERE empresa_id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002'
);
DELETE FROM personas WHERE empresa_id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002'
);
DELETE FROM empresas WHERE id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002'
);

-- ============================================================
-- PASO 2: Renombrar empresa actual a Grupo Meridian S.A.
-- ============================================================
UPDATE empresas 
SET nombre = 'Grupo Meridian S.A.', rubro = 'Consultoría y Gestión Empresarial'
WHERE id = (
  SELECT empresa_id FROM profiles 
  WHERE empresa_id IS NOT NULL 
  GROUP BY empresa_id ORDER BY COUNT(*) DESC LIMIT 1
);

-- ============================================================
-- PASO 3: Crear empresas históricas (una por persona)
-- ============================================================
INSERT INTO empresas (id, nombre, rubro) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Banco Galicia', 'Banca y Finanzas'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Molinos Río de la Plata S.A.', 'Consumo Masivo'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'PwC Argentina', 'Consultoría y Auditoría'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Techint Group', 'Ingeniería y Construcción'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'Mercado Libre', 'Tecnología y E-Commerce'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'Publicis Groupe Argentina', 'Publicidad y Marketing'),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'Accenture Argentina', 'Consultoría Tecnológica'),
  ('bbbbbbbb-0000-0000-0000-000000000008', 'Grupo Clarín', 'Medios y Comunicación')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASO 4: Personas históricas — María González (TRZ-C8DX-6UH)
-- ============================================================
INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000001', nombre, apellido,
  'Analista de Desarrollo Organizacional', 'Capital Humano',
  traza_id, false, '2018-03-01', '2021-06-30'
FROM personas WHERE traza_id = 'TRZ-C8DX-6UH' AND empleo_activo = true LIMIT 1;

INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000002', nombre, apellido,
  'Coordinadora de Recursos Humanos', 'Recursos Humanos',
  traza_id, false, '2021-08-01', '2023-11-30'
FROM personas WHERE traza_id = 'TRZ-C8DX-6UH' AND empleo_activo = true LIMIT 1;

-- ============================================================
-- PASO 5: Personas históricas — Juan Pérez (TRZ-VUVK-A4P)
-- ============================================================
INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000003', nombre, apellido,
  'Consultor Junior de Finanzas', 'Advisory',
  traza_id, false, '2019-04-01', '2022-03-31'
FROM personas WHERE traza_id = 'TRZ-VUVK-A4P' AND empleo_activo = true LIMIT 1;

INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000004', nombre, apellido,
  'Analista de Control de Gestión', 'Finanzas Corporativas',
  traza_id, false, '2022-05-01', '2023-12-31'
FROM personas WHERE traza_id = 'TRZ-VUVK-A4P' AND empleo_activo = true LIMIT 1;

-- ============================================================
-- PASO 6: Personas históricas — Ana López (TRZ-7T5B-VZ4)
-- ============================================================
INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000006', nombre, apellido,
  'Ejecutiva de Cuentas', 'Clientes',
  traza_id, false, '2018-06-01', '2021-05-31'
FROM personas WHERE traza_id = 'TRZ-7T5B-VZ4' AND empleo_activo = true LIMIT 1;

INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000005', nombre, apellido,
  'Especialista en Marketing Digital', 'Growth',
  traza_id, false, '2021-07-01', '2023-10-31'
FROM personas WHERE traza_id = 'TRZ-7T5B-VZ4' AND empleo_activo = true LIMIT 1;

-- ============================================================
-- PASO 7: Personas históricas — Lucca Lofredo (TRZ-LWUY-YJZ)
-- ============================================================
INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000007', nombre, apellido,
  'Analista de Sistemas', 'Technology',
  traza_id, false, '2019-02-01', '2022-01-31'
FROM personas WHERE traza_id = 'TRZ-LWUY-YJZ' AND empleo_activo = true LIMIT 1;

INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000008', nombre, apellido,
  'Desarrollador de Producto Digital', 'Producto',
  traza_id, false, '2022-03-01', '2023-12-31'
FROM personas WHERE traza_id = 'TRZ-LWUY-YJZ' AND empleo_activo = true LIMIT 1;

-- ============================================================
-- PASO 8: Objetivos históricos — María en Banco Galicia
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000001', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Diseño del programa de onboarding corporativo','Completado','De acuerdo',100,'Alta','2018-12-31','Asignado','Resultado'),
  ('Implementación de encuestas de clima organizacional','Completado','De acuerdo',100,'Media','2019-06-30','Asignado','Hábito'),
  ('Reducción de rotación de personal en 15%','Completado','De acuerdo',100,'Alta','2019-12-31','Asignado','Resultado'),
  ('Certificación en Gestión de Talento (SHRM)','Completado','De acuerdo',100,'Media','2020-06-30','Personal','Aprendizaje'),
  ('Plan de desarrollo de líderes de primer nivel','Completado','Parcialmente de acuerdo',85,'Alta','2020-12-31','Asignado','Resultado'),
  ('Digitalización de legajos de empleados','Completado','De acuerdo',100,'Media','2021-05-31','Asignado','Eficiencia')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND p.traza_id = 'TRZ-C8DX-6UH';

-- ============================================================
-- PASO 9: Objetivos históricos — María en Molinos
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000002', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Reestructuración del proceso de selección de personal','Completado','De acuerdo',100,'Alta','2022-03-31','Asignado','Resultado'),
  ('Implementación de evaluaciones de desempeño 360°','Completado','De acuerdo',100,'Alta','2022-09-30','Asignado','Resultado'),
  ('Programa de bienestar laboral para planta industrial','Completado','De acuerdo',100,'Media','2023-03-31','Asignado','Hábito'),
  ('Negociación de convenio colectivo de trabajo','Completado','Parcialmente de acuerdo',90,'Alta','2023-09-30','Asignado','Resultado'),
  ('Formación de líderes en gestión de equipos','Completado','De acuerdo',100,'Media','2023-11-30','Personal','Aprendizaje')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000002' AND p.traza_id = 'TRZ-C8DX-6UH';

-- ============================================================
-- PASO 10: Objetivos históricos — Juan en PwC
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000003', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Auditoría financiera de cliente multinacional','Completado','De acuerdo',100,'Alta','2019-12-31','Asignado','Resultado'),
  ('Certificación CPA (Contador Público Autorizado)','Completado','De acuerdo',100,'Alta','2020-06-30','Personal','Aprendizaje'),
  ('Modelo de valoración de empresas para M&A','Completado','De acuerdo',100,'Alta','2020-12-31','Asignado','Resultado'),
  ('Due diligence para fusión en sector retail','Completado','De acuerdo',100,'Alta','2021-06-30','Asignado','Resultado'),
  ('Optimización de procesos de reporte financiero','Completado','Parcialmente de acuerdo',88,'Media','2021-12-31','Asignado','Eficiencia'),
  ('Capacitación en NIIF (Normas Internacionales)','Completado','De acuerdo',100,'Media','2022-02-28','Personal','Aprendizaje')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000003' AND p.traza_id = 'TRZ-VUVK-A4P';

-- ============================================================
-- PASO 11: Objetivos históricos — Juan en Techint
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000004', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Control presupuestario de proyecto de infraestructura','Completado','De acuerdo',100,'Alta','2022-09-30','Asignado','Resultado'),
  ('Implementación de SAP FI para reportes de gestión','Completado','De acuerdo',100,'Alta','2023-03-31','Asignado','Resultado'),
  ('Reducción de costos operativos en 12%','Completado','De acuerdo',100,'Alta','2023-09-30','Asignado','Eficiencia'),
  ('Presentación de resultados a directorio regional','Completado','De acuerdo',100,'Media','2023-12-31','Asignado','Resultado')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000004' AND p.traza_id = 'TRZ-VUVK-A4P';

-- ============================================================
-- PASO 12: Objetivos históricos — Ana en Publicis
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000006', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Lanzamiento de campaña 360° para cliente FMCG','Completado','De acuerdo',100,'Alta','2018-12-31','Asignado','Resultado'),
  ('Gestión de presupuesto anual de medios (USD 2M)','Completado','De acuerdo',100,'Alta','2019-06-30','Asignado','Resultado'),
  ('Incremento de engagement en redes sociales 40%','Completado','De acuerdo',100,'Media','2019-12-31','Asignado','Eficiencia'),
  ('Certificación en Google Ads y Meta Business','Completado','De acuerdo',100,'Media','2020-06-30','Personal','Aprendizaje'),
  ('Campaña de rebranding para cliente bancario','Completado','Parcialmente de acuerdo',82,'Alta','2020-12-31','Asignado','Resultado'),
  ('Mentoría a equipo junior de cuentas','Completado','De acuerdo',100,'Media','2021-05-31','Personal','Hábito')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000006' AND p.traza_id = 'TRZ-7T5B-VZ4';

-- ============================================================
-- PASO 13: Objetivos históricos — Ana en Mercado Libre
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000005', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Optimización de funnel de conversión +25%','Completado','De acuerdo',100,'Alta','2021-12-31','Asignado','Eficiencia'),
  ('Estrategia de contenidos para categoría Moda','Completado','De acuerdo',100,'Alta','2022-06-30','Asignado','Resultado'),
  ('A/B testing de campañas de performance','Completado','De acuerdo',100,'Media','2022-12-31','Asignado','Hábito'),
  ('Lanzamiento de programa de fidelización','Completado','Parcialmente de acuerdo',91,'Alta','2023-06-30','Asignado','Resultado'),
  ('Análisis de datos con SQL y Tableau','Completado','De acuerdo',100,'Media','2023-10-31','Personal','Aprendizaje')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000005' AND p.traza_id = 'TRZ-7T5B-VZ4';

-- ============================================================
-- PASO 14: Objetivos históricos — Lucca en Accenture
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000007', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Migración de sistemas legacy a arquitectura cloud','Completado','De acuerdo',100,'Alta','2019-12-31','Asignado','Resultado'),
  ('Desarrollo de API REST para cliente bancario','Completado','De acuerdo',100,'Alta','2020-06-30','Asignado','Resultado'),
  ('Certificación AWS Solutions Architect','Completado','De acuerdo',100,'Alta','2020-12-31','Personal','Aprendizaje'),
  ('Automatización de procesos con RPA (UiPath)','Completado','De acuerdo',100,'Media','2021-06-30','Asignado','Eficiencia'),
  ('Liderazgo de squad de 4 desarrolladores','Completado','Parcialmente de acuerdo',88,'Alta','2021-12-31','Asignado','Resultado')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000007' AND p.traza_id = 'TRZ-LWUY-YJZ';

-- ============================================================
-- PASO 15: Objetivos históricos — Lucca en Grupo Clarín
-- ============================================================
INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
SELECT 'bbbbbbbb-0000-0000-0000-000000000008', p.id, obj.titulo, obj.estado, obj.validacion, obj.progreso, obj.prioridad, obj.fecha_limite::date, obj.tipo, obj.categoria, false
FROM personas p
CROSS JOIN (VALUES
  ('Rediseño de arquitectura de plataforma digital','Completado','De acuerdo',100,'Alta','2022-09-30','Asignado','Resultado'),
  ('Implementación de sistema de A/B testing propio','Completado','De acuerdo',100,'Alta','2023-03-31','Asignado','Resultado'),
  ('Reducción de tiempo de carga del sitio en 60%','Completado','De acuerdo',100,'Alta','2023-09-30','Asignado','Eficiencia'),
  ('Formación en product management (cursos PM)','Completado','De acuerdo',100,'Media','2023-12-31','Personal','Aprendizaje')
) AS obj(titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria)
WHERE p.empresa_id = 'bbbbbbbb-0000-0000-0000-000000000008' AND p.traza_id = 'TRZ-LWUY-YJZ';
