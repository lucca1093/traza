-- ═══════════════════════════════════════════════════════════════
-- SEED_REUNIONES.SQL — v2 con nombres correctos
-- Empresa: Grupo Meridian S.A.
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- LUCIANA FERREYRA ↔ DIEGO MOLINA (6 reuniones)
-- ──────────────────────────────────────────────────────────────
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Diego'   AND apellido = 'Molina'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  r.fecha::date, r.agenda, r.notas, r.acuerdos, NULL, r.proxima::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
FROM (VALUES
  ('2025-04-10',
   'Arranque Q2: revisión de objetivos y expectativas del trimestre',
   'Luciana arranca Q2 con 38 leads activos, debajo de los 50 del objetivo. Acordamos foco en LinkedIn para acelerar prospección. Tasa de conversión actual: 28%. Se necesita trabajar el pitch de ROI.',
   'Luciana prepara un nuevo deck de ROI para la semana del 21. Diego comparte casos de éxito de clientes actuales como referencia.',
   '2025-05-15'),
  ('2025-05-15',
   'Seguimiento leads Q2 + revisión deck ROI',
   'Buen progreso: 54 leads en abril, por encima del objetivo por primera vez. El deck de ROI fue presentado en 2 demos con resultado positivo. Dos oportunidades grandes en negociación: Grupo Aldea (120k ARR) y Tecno Sur (80k ARR).',
   'Finalizar deck ROI y compartirlo con el equipo comercial. Luciana hace follow-up de Grupo Aldea antes del 23/5. Diego revisa términos de pago para Tecno Sur.',
   '2025-06-12'),
  ('2025-06-12',
   'Revisión tasa de conversión + cierre Grupo Aldea',
   'Grupo Aldea cerrado en 115k ARR. Tecno Sur sigue en evaluación interna. Tasa de conversión subió a 34%. Luciana identificó que el deck funciona mejor personalizado por sector. Plan de fidelización: los 20 clientes top ya están mapeados y segmentados.',
   'Luciana prepara versiones del deck por sector (retail, tech, servicios). Diego gestiona aprobación del programa de fidelización con Sofía.',
   '2025-07-17'),
  ('2025-07-17',
   'Cierre Q2 + planificación Q3 + arranque programa fidelización',
   'Q2 cerrado: tasa de conversión promedio 35% (objetivo: 40%). Leads: promedio 51/mes, superando el objetivo. Programa de fidelización aprobado. Luciana lidera el piloto con los 5 clientes Tier 1. Arranca el curso de negociación de Harvard Online la semana siguiente.',
   'Piloto fidelización arranca el 25/7. Primer check-in de resultados el 15/8. Luciana envía update semanal por mail sobre el avance del programa.',
   '2025-08-14'),
  ('2025-08-14',
   'Seguimiento piloto fidelización + avance curso negociación',
   '3 de 5 clientes Tier 1 onboardeados al programa. Los otros 2 tienen reuniones programadas. Primeras señales: 2 clientes hicieron upsell luego de ingresar al programa. Curso de Harvard al 60%, aplicó la técnica de anclaje en 2 reuniones con resultados positivos. Tecno Sur cerrado en 75k ARR.',
   'Completar onboarding de los 5 Tier 1 antes del 31/8. Luciana presenta resultados del curso con ejemplos concretos en la próxima reunión. Diego habla con producto para habilitar acceso anticipado a features para Tier 1.',
   '2025-09-11'),
  ('2025-09-11',
   'Cierre Q3 + evaluación semestral de desempeño',
   'Q3: leads promedio 58/mes. Tasa de conversión Q3: 37%. Programa de fidelización: 12 clientes activos, NPS subió de 42 a 54. Curso de negociación completado con certificado. Luciana propone explorar automatización de outreach. Conversación de carrera: posible promoción a Senior en Q1 2026.',
   'Diego investiga herramientas de outreach automation. Luciana prepara análisis de impacto del programa de fidelización para octubre. Evaluación formal de carrera en diciembre.',
   '2025-10-09')
) AS r(fecha, agenda, notas, acuerdos, proxima)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
    AND fecha = r.fecha::date
);

-- ──────────────────────────────────────────────────────────────
-- CAMILA ORTEGA ↔ DIEGO MOLINA (4 reuniones)
-- ──────────────────────────────────────────────────────────────
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Diego'  AND apellido = 'Molina'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Camila' AND apellido = 'Ortega'),
  r.fecha::date, r.agenda, r.notas, r.acuerdos, NULL, r.proxima::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
FROM (VALUES
  ('2025-04-22',
   'Revisión Q1 + mapeo de procesos críticos',
   'Camila completó el mapeo de los 8 procesos core de operaciones. Identificó 3 con tiempos de ciclo por encima del benchmark. El proceso de despacho tiene una brecha de 2 días respecto al estándar del sector. Propone implementar un tablero Kanban físico en el depósito.',
   'Camila arma una propuesta de mejora para los 3 procesos con mayor desvío. Diego aprueba la implementación del Kanban en el depósito la semana del 28/4.',
   '2025-05-27'),
  ('2025-05-27',
   'Resultados Kanban + propuesta de mejora de procesos',
   'El Kanban redujo los errores de picking en un 22% en el primer mes. La propuesta de mejora de procesos fue presentada a Diego: rediseño del workflow de recepción de mercadería (ahorra 45 min/día) y digitalización del parte diario. Camila coordinó la capacitación del equipo de depósito sin que Diego lo pidiera, iniciativa muy valorada.',
   'Diego aprueba la digitalización del parte diario. Camila lidera la implementación con el equipo de tecnología. Presentación de resultados del rediseño de recepción en julio.',
   '2025-07-03'),
  ('2025-07-03',
   'Digitalización parte diario + resultados rediseño recepción',
   'Parte diario digital implementado en todos los turnos. Rediseño de recepción de mercadería: tiempo de ciclo bajó de 3,5h a 2,2h (37% de mejora). Camila está trabajando en un SLA interno para el proceso de despacho. Conversación sobre su desarrollo: quiere certificarse en Lean Six Sigma Green Belt.',
   'Diego gestiona con RRHH el presupuesto para la certificación Green Belt. Camila envía el SLA de despacho para revisión antes del 15/7.',
   '2025-08-07'),
  ('2025-08-07',
   'SLA despacho + evaluación semestral',
   'SLA de despacho aprobado e implementado. En el primer mes: 94% de cumplimiento (objetivo: 90%). Evaluación semestral: Diego la calificó como "por encima de las expectativas". Camila está postulada para el Green Belt en septiembre. Conversación sobre su rol futuro: podría liderar un proyecto de mejora cross-área en Q4.',
   'Camila lidera el proyecto de optimización del proceso de inventario en Q4. Diego la presenta como referente de mejora continua en la reunión de directores de agosto.',
   '2025-09-04')
) AS r(fecha, agenda, notas, acuerdos, proxima)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Camila' AND apellido = 'Ortega')
    AND fecha = r.fecha::date
);

-- ──────────────────────────────────────────────────────────────
-- VALENTINA CRUZ ↔ SOFÍA REYNOSO (4 reuniones)
-- ──────────────────────────────────────────────────────────────
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Sofía'     AND apellido = 'Reynoso'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Valentina' AND apellido = 'Cruz'),
  r.fecha::date, r.agenda, r.notas, r.acuerdos, NULL, r.proxima::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
FROM (VALUES
  ('2025-04-17',
   'Revisión cuota Q1 + estrategia Q2',
   'Valentina cerró Q1 al 112% de cuota. Ciclo de ventas promedio: 28 días. Para Q2: el foco es reducir ese ciclo a 22 días implementando calificación BANT desde el primer contacto. Pipeline actual: 24 oportunidades por 480k ARR.',
   'Valentina prepara el playbook de calificación BANT para el equipo. Sofía revisa y aprueba antes del 25/4.',
   '2025-05-22'),
  ('2025-05-22',
   'Resultados BANT + pipeline Q2',
   'El ciclo de ventas bajó a 24 días en abril (objetivo: 22). Pipeline Q2: 31 oportunidades. Valentina identificó que los deals que pasan por BANT tienen un 40% más de tasa de cierre. Conversación sobre un deal grande en riesgo: cliente evaluando competencia, precio es la objeción principal.',
   'Sofía va a hacer una llamada conjunta con Valentina al cliente en riesgo esta semana. Valentina prepara análisis de ROI personalizado para ese cliente.',
   '2025-06-26'),
  ('2025-06-26',
   'Cierre Q2 + cuenta enterprise ganada',
   'Q2 cerrado al 118% de cuota. El cliente en riesgo fue retenido con una propuesta de precio anual con descuento por volumen. Ciclo de ventas promedio Q2: 23 días (casi en objetivo). Valentina propone implementar forecasting semanal para tener mejor visibilidad del pipeline.',
   'Valentina lidera la implementación del proceso de forecasting semanal a partir de julio. Sofía aprueba un bono de performance por el resultado de Q2.',
   '2025-08-07'),
  ('2025-08-07',
   'Forecasting + evaluación semestral + objetivos H2',
   'El proceso de forecasting semanal está funcionando: la precisión del forecast mejoró del 68% al 84% en el primer mes. Evaluación semestral: Sofía la calificó como "excepcional". Target H2: 15% por encima de H1. Valentina quiere desarrollar habilidades de liderazgo para eventualmente liderar un equipo.',
   'Sofía va a incluir a Valentina en el programa de liderazgo del Q4. Valentina lidera la capacitación de ventas del nuevo ingresante de septiembre.',
   '2025-09-18')
) AS r(fecha, agenda, notas, acuerdos, proxima)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Valentina' AND apellido = 'Cruz')
    AND fecha = r.fecha::date
);

-- ──────────────────────────────────────────────────────────────
-- MARTÍN AGUIRRE ↔ SOFÍA REYNOSO (3 reuniones)
-- ──────────────────────────────────────────────────────────────
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Sofía'  AND apellido = 'Reynoso'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Martín' AND apellido = 'Aguirre'),
  r.fecha::date, r.agenda, r.notas, r.acuerdos, NULL, r.proxima::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
FROM (VALUES
  ('2025-05-08',
   'Estado de cuentas clave + avance certificación Salesforce',
   'Martín gestiona 3 cuentas clave: NPS promedio 8.4 (objetivo: >8). Una cuenta tiene señales de churn: menos engagement en las últimas semanas. Certificación Salesforce: curso al 70%, examen programado para el 20/6.',
   'Martín agenda una business review con la cuenta de bajo engagement antes del 20/5. Sofía acompaña en esa reunión. Definir plan de contingencia si el cliente decide no renovar.',
   '2025-06-19'),
  ('2025-06-19',
   'Business review cuenta en riesgo + certificación completada',
   'La business review fue exitosa: el cliente renovó y amplió el contrato (+20% ARR). El engagement bajo era por falta de uso de features clave. Martín preparó un plan de adoption que fue muy valorado. Certificación Salesforce obtenida con 91/100. Las otras 2 cuentas clave tienen NPS de 9.1 y 8.7.',
   'Martín va a replicar el plan de adoption con las otras 2 cuentas clave como práctica preventiva. Sofía va a proponer a Martín como referente de Salesforce para el equipo.',
   '2025-07-31'),
  ('2025-07-31',
   'Expansión cuentas clave + rol de referente Salesforce',
   'Las 2 cuentas restantes implementaron el plan de adoption. NPS promedio del portfolio: 9.0. Una de las cuentas amplió el contrato por la mejora en el uso de la plataforma. Martín ya dio 2 capacitaciones internas de Salesforce al equipo comercial. Sofía le ofrece un rol formal de Salesforce Champion.',
   'Martín acepta el rol de Salesforce Champion. Va a documentar las mejores prácticas y crear un playbook de uso para el equipo. Revisión de impacto en octubre.',
   '2025-09-04')
) AS r(fecha, agenda, notas, acuerdos, proxima)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Martín' AND apellido = 'Aguirre')
    AND fecha = r.fecha::date
);

-- ──────────────────────────────────────────────────────────────
-- FLORENCIA HERRERA ↔ SOFÍA REYNOSO (3 reuniones)
-- ──────────────────────────────────────────────────────────────
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Sofía'     AND apellido = 'Reynoso'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Florencia' AND apellido = 'Herrera'),
  r.fecha::date, r.agenda, r.notas, r.acuerdos, NULL, r.proxima::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
FROM (VALUES
  ('2025-04-29',
   'Programa de onboarding + pipeline de liderazgo',
   'Florencia presentó el programa de onboarding estructurado (30-60-90 días). Los 2 primeros ingresos que lo completaron tuvieron un 40% menos de errores en el primer mes. El pipeline de liderazgo tiene 4 candidatos identificados. Conversación sobre cómo medir el impacto del programa de desarrollo.',
   'Florencia define métricas de impacto para el programa de liderazgo: engagement, retención, tiempo para primera promoción. Sofía aprueba el presupuesto para la primera cohorte del track de líderes.',
   '2025-06-10'),
  ('2025-06-10',
   'Primera cohorte track líderes + resultados onboarding',
   'Primera cohorte del track de liderazgo arrancó con 4 participantes. NPS del programa de onboarding: 92/100. Los ingresos de Q1 tienen un tiempo de rampa 35% más corto que el histórico. Florencia propone extender el programa de onboarding a todas las áreas (hoy solo está en Comercial y Operaciones).',
   'Florencia prepara una presentación para extender el onboarding al resto de las áreas. Sofía la apoya en la reunión con los directores de área.',
   '2025-07-24'),
  ('2025-07-24',
   'Extensión onboarding + evaluación semestral',
   'El onboarding extendido fue aprobado por todos los directores. Rollout planificado para Q3. Evaluación semestral: Sofía la calificó como "excepcional" destacando el impacto concreto del onboarding y su capacidad de influir sin autoridad formal. Conversación sobre su crecimiento hacia un rol de People Partner más estratégico.',
   'Florencia va a proponer un modelo de People Partner por área para discutir en el planning de Q4. Sofía va a presentar su trabajo en la reunión de directores de agosto.',
   '2025-09-11')
) AS r(fecha, agenda, notas, acuerdos, proxima)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Florencia' AND apellido = 'Herrera')
    AND fecha = r.fecha::date
);

-- ──────────────────────────────────────────────────────────────
-- Verificación final
-- ──────────────────────────────────────────────────────────────
SELECT
  e.nombre || ' ' || e.apellido AS empleado,
  s.nombre || ' ' || s.apellido AS supervisor,
  COUNT(*) AS reuniones,
  MAX(r.fecha) AS ultima_reunion
FROM reuniones_1on1 r
JOIN personas e ON e.id = r.empleado_id
JOIN personas s ON s.id = r.supervisor_id
WHERE r.empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
GROUP BY e.nombre, e.apellido, s.nombre, s.apellido
ORDER BY empleado;
