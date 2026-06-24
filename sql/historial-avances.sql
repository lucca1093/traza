-- ============================================================
-- TRAZA — Historial realista de avances y validaciones
-- Correr en Supabase SQL Editor (rol postgres / service role)
-- ============================================================

-- ── 1. Objetivos continuos (sin fecha de vencimiento) ────────

UPDATE objetivos SET es_continuo = true, fecha_limite = NULL
WHERE id IN (
  'b8cc3359-fd0e-4848-bc24-d8382bf949ee',  -- Liderar retrospectiva mensual (María)
  '32fa4239-4de0-4628-a23f-d436be826124',  -- Liderar reuniones semanales (Juan)
  '50a37ec2-6c7a-4d40-9697-694b12cbd844'   -- Mejorar habilidades presentación (Ana)
);

-- ── 2. Ajustar fechas límite ──────────────────────────────────

-- María
UPDATE objetivos SET fecha_limite = '2025-03-31' WHERE id = '12259609-442c-4822-9149-0a0259bc3388';
UPDATE objetivos SET fecha_limite = '2025-06-30' WHERE id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44';
UPDATE objetivos SET fecha_limite = '2025-09-30' WHERE id = '27c968b7-a396-4abd-a88c-e437b33162ff';
UPDATE objetivos SET fecha_limite = '2025-12-31' WHERE id = '00fa68e0-be25-458a-a28d-f403ae78e069';
UPDATE objetivos SET fecha_limite = '2026-08-31' WHERE id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8';
UPDATE objetivos SET fecha_limite = '2026-09-30' WHERE id = '9af9253f-ae8d-4886-ad29-48f6cdcb1f71';

-- Lucca
UPDATE objetivos SET fecha_limite = '2026-12-31' WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d';
UPDATE objetivos SET fecha_limite = '2026-09-30' WHERE id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c';
UPDATE objetivos SET fecha_limite = '2025-06-30' WHERE id = '5b630116-11ee-435d-8383-2e7020edc0cc';
UPDATE objetivos SET fecha_limite = '2026-07-31' WHERE id = '15973804-ee0e-42ec-9538-083c86c63f92';
UPDATE objetivos SET fecha_limite = '2025-12-31' WHERE id = 'a1625fa7-d1de-4228-a2c9-cab2d562c9b2';
UPDATE objetivos SET fecha_limite = '2026-10-31' WHERE id = '3286c6b5-ac04-4907-82c7-5dec0b9bf686';
UPDATE objetivos SET fecha_limite = '2026-07-15' WHERE id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3';
UPDATE objetivos SET fecha_limite = '2026-08-31' WHERE id = '4f2320a7-883c-4ef1-9e37-1702b51259b9';
UPDATE objetivos SET fecha_limite = '2025-03-31' WHERE id = 'c32c98d8-9f5f-4910-a37b-51d0adfd7a31';
UPDATE objetivos SET fecha_limite = '2026-09-30' WHERE id = '3dde24f9-c920-47f9-937e-9fb478caef1e';

-- Ana
UPDATE objetivos SET fecha_limite = '2025-11-30' WHERE id = 'd026bd24-5b25-4932-9298-7e56bc690fa1';
UPDATE objetivos SET fecha_limite = '2026-06-30' WHERE id = 'a9617ec6-762f-44dc-b143-8c7710ba0666';
UPDATE objetivos SET fecha_limite = '2025-12-31' WHERE id = 'cb07338a-a10f-4a60-8039-59f92a22d434';
UPDATE objetivos SET fecha_limite = '2026-08-31' WHERE id = '41eb6f93-d470-4290-a784-6d0f74bddb07';
UPDATE objetivos SET fecha_limite = '2026-10-31' WHERE id = 'd61418b4-ee1b-400f-9e77-a232623c1dbf';
UPDATE objetivos SET fecha_limite = '2026-09-30' WHERE id = 'c1cec87d-8aa2-4e70-828f-95587e3a2980';
UPDATE objetivos SET fecha_limite = '2026-06-30' WHERE id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b';

-- Juan
UPDATE objetivos SET fecha_limite = '2025-08-31' WHERE id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266';

-- ── 3. Autoevaluación y comentarios del empleado ─────────────

-- María
UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'El proceso fue implementado exitosamente. Redujimos el tiempo de incorporación de 5 días a 2 días. Los primeros 3 ingresos ya pasaron por el flujo nuevo sin inconvenientes.'
WHERE id = '12259609-442c-4822-9149-0a0259bc3388';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Completé la capacitación completa. Ya estoy usando las herramientas en mi flujo diario. Noto una mejora real en los tiempos de gestión de tareas.'
WHERE id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Las retrospectivas mensuales se realizan de forma consistente. El equipo participa activamente y logramos implementar mejoras concretas en cada ciclo.'
WHERE id = 'b8cc3359-fd0e-4848-bc24-d8382bf949ee';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Auditoría finalizada sin observaciones críticas. Informe entregado a gerencia con 4 recomendaciones de mejora, dos ya en implementación.'
WHERE id = '27c968b7-a396-4abd-a88c-e437b33162ff';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'Completé la estructura general del manual y los procedimientos de las áreas de ventas y operaciones. Me falta completar el área de finanzas. Estimado: 2 semanas más.'
WHERE id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'La encuesta está diseñada y validada internamente. La demora fue por agenda de los líderes de área. Tenemos fecha para lanzarla la próxima semana.'
WHERE id = '9af9253f-ae8d-4886-ad29-48f6cdcb1f71';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'El 70% del equipo completó la capacitación CRM. Quedan 3 personas pendientes por licencias que se extendieron. Las capacitaré cuando retornen.'
WHERE id = '00fa68e0-be25-458a-a28d-f403ae78e069';

-- Lucca
UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Beta lanzada en tiempo y forma. Tenemos 3 empresas piloto onboardeadas y activas. El feedback inicial es muy positivo.'
WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'El plan de mejora fue co-creado con el equipo. Estamos en la fase de implementación de las primeras 3 iniciativas. Buen ritmo.'
WHERE id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'Aprobé el examen final con nota 7.2/10. Superé el mínimo requerido pero quiero reforzar el módulo de gestión de riesgos antes de cerrar.'
WHERE id = '5b630116-11ee-435d-8383-2e7020edc0cc';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Voy al 60% del curso. Es muy completo. Estoy aplicando los conceptos de liderazgo situacional directamente con el equipo.'
WHERE id = '15973804-ee0e-42ec-9538-083c86c63f92';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Todos los procesos del área documentados y publicados en Notion. El equipo ya los referencia en el día a día. Reducimos consultas repetidas un 40%.'
WHERE id = 'a1625fa7-d1de-4228-a2c9-cab2d562c9b2';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'Estoy trabajando el storytelling con el equipo. Las presentaciones mejoraron en estructura pero sigo puliendo el manejo del tiempo y el cierre ejecutivo.'
WHERE id = '3286c6b5-ac04-4907-82c7-5dec0b9bf686';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Tuvimos la sesión de OKRs con todo el equipo. Los objetivos están definidos. Pendiente la validación final con dirección la semana que viene.'
WHERE id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'TRAZA está en adopción real: 18 de 22 usuarios activos en la plataforma. Los 4 restantes están en proceso de onboarding. Todo va muy bien.'
WHERE id = '4f2320a7-883c-4ef1-9e37-1702b51259b9';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Presentación ante directorio exitosa. Todas las preguntas fueron respondidas, el Q1 cerró en verde. Directorio aprobó el presupuesto Q2.'
WHERE id = 'c32c98d8-9f5f-4910-a37b-51d0adfd7a31';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'Evalué 4 de 6 herramientas. Falta revisar Loom y Miro. El análisis comparativo lo termino esta semana.'
WHERE id = '3dde24f9-c920-47f9-937e-9fb478caef1e';

-- Ana
UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Proceso documentado y activo. Los primeros 4 ingresos pasaron por el flujo nuevo. Redujimos el tiempo de integración de 2 semanas a 5 días.'
WHERE id = 'd026bd24-5b25-4932-9298-7e56bc690fa1';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'Completé módulos 1 y 2. Me falta el módulo 3 de análisis avanzado. Lo tengo agendado para las próximas 2 semanas.'
WHERE id = 'a9617ec6-762f-44dc-b143-8c7710ba0666';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Practico presentaciones dos veces por semana. Noto mejora real en claridad, timing y manejo de preguntas del público.'
WHERE id = '50a37ec2-6c7a-4d40-9697-694b12cbd844';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Tiempo promedio de respuesta bajó de 4hs a 1.5hs. Implementamos un sistema de triage por urgencia y funcionó perfecto.'
WHERE id = 'cb07338a-a10f-4a60-8039-59f92a22d434';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Evento organizado para el 18/07. Confirmación del 88% del equipo. Tenemos venue, catering y actividad definidos.'
WHERE id = '41eb6f93-d470-4290-a784-6d0f74bddb07';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'Relevé 4 áreas de 7. Me faltan RRHH, IT y Finanzas. Tengo reuniones agendadas con los referentes esta semana.'
WHERE id = 'd61418b4-ee1b-400f-9e77-a232623c1dbf';

UPDATE objetivos SET
  autoevaluacion = 'Parcialmente satisfecho',
  comentario_empleado = 'Borrador completado. Los puntos de desconexión digital y guardia remota necesitan alineación con dirección antes de publicar.'
WHERE id = 'c1cec87d-8aa2-4e70-828f-95587e3a2980';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Plan diseñado con 4 ejes: bienestar, retención, desarrollo y reconocimiento. Listo para presentar a dirección el próximo martes.'
WHERE id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b';

-- Juan
UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Las reuniones se realizan todos los lunes sin falta. Formato de 30 minutos: 3 puntos clave + bloqueos + próximos pasos. El equipo valora la dinámica.'
WHERE id = '32fa4239-4de0-4628-a23f-d436be826124';

UPDATE objetivos SET
  autoevaluacion = 'Satisfecho',
  comentario_empleado = 'Implementamos sistema de triage y tiempo de primera respuesta bajó un 62%. El cliente interno está notando la diferencia.'
WHERE id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266';


-- ── 4. Avances con historial de ida y vuelta ─────────────────
-- Usamos subqueries para empresa_id, persona_id y creado_por
-- respondido_por = NULL (histórico, supervisor anónimo)


-- ════════ MARÍA ════════

-- [OBJ 1] Implementar nuevo proceso de onboarding — Completado / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '12259609-442c-4822-9149-0a0259bc3388'),
  '12259609-442c-4822-9149-0a0259bc3388',
  (SELECT persona_id FROM objetivos WHERE id = '12259609-442c-4822-9149-0a0259bc3388'),
  'comentario',
  'Inicié el mapeo del proceso actual. Identifiqué 8 pasos críticos que necesitan documentación formal. Empiezo por el flujo de alta en sistemas.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '12259609-442c-4822-9149-0a0259bc3388'),
  '2025-01-15 10:30:00+00',
  'aprobado',
  'Muy buen comienzo. Asegurate de incluir también el paso de alta en sistemas IT y los accesos a las plataformas internas.',
  '2025-01-16 09:15:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '12259609-442c-4822-9149-0a0259bc3388'),
  '12259609-442c-4822-9149-0a0259bc3388',
  (SELECT persona_id FROM objetivos WHERE id = '12259609-442c-4822-9149-0a0259bc3388'),
  'link',
  'https://docs.google.com/document/d/onboarding-proceso-v1',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '12259609-442c-4822-9149-0a0259bc3388'),
  '2025-02-10 14:20:00+00',
  'aprobado',
  'Documento muy completo. Incluí el acceso IT como comentamos. Lo comparto con RRHH para revisión y feedback.',
  '2025-02-11 11:30:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '12259609-442c-4822-9149-0a0259bc3388'),
  '12259609-442c-4822-9149-0a0259bc3388',
  (SELECT persona_id FROM objetivos WHERE id = '12259609-442c-4822-9149-0a0259bc3388'),
  'comentario',
  'Proceso implementado. Primeros 3 ingresos pasaron por el flujo nuevo. Tiempo promedio de incorporación: de 5 días a 2 días. Sin inconvenientes.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '12259609-442c-4822-9149-0a0259bc3388'),
  '2025-03-28 16:45:00+00',
  'aprobado',
  'Excelente resultado. El impacto es concreto y medible. Objetivo 100% cumplido.',
  '2025-03-29 10:00:00+00'
);

-- [OBJ 2] Capacitación en herramientas digitales — Completado / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44'),
  '9f2ce181-4944-43f3-9fa0-8e0da74e0c44',
  (SELECT persona_id FROM objetivos WHERE id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44'),
  'comentario',
  'Completé los módulos 1 y 2 de Notion y el curso de Monday.com. Ya empiezo a integrar ambas en mi gestión diaria.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44'),
  '2025-04-05 09:00:00+00',
  'aprobado',
  'Buenísimo. Cuanto antes puedas integrar al resto del equipo, mejor. ¿Podés dar una demo interna?',
  '2025-04-06 10:30:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44'),
  '9f2ce181-4944-43f3-9fa0-8e0da74e0c44',
  (SELECT persona_id FROM objetivos WHERE id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44'),
  'comentario',
  'Di la demo interna al equipo (8 personas). Muy buena recepción. Preparé el material de referencia rápida para que quede en Notion.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '9f2ce181-4944-43f3-9fa0-8e0da74e0c44'),
  '2025-06-20 15:10:00+00',
  'aprobado',
  'Perfecto María. La demo fue muy clara y el material de referencia es muy útil. Cerramos este objetivo.',
  '2025-06-21 09:00:00+00'
);

-- [OBJ 3] Retrospectiva mensual — En progreso / continuo / visto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'b8cc3359-fd0e-4848-bc24-d8382bf949ee'),
  'b8cc3359-fd0e-4848-bc24-d8382bf949ee',
  (SELECT persona_id FROM objetivos WHERE id = 'b8cc3359-fd0e-4848-bc24-d8382bf949ee'),
  'comentario',
  'Retrospectiva de mayo realizada. 7 de 8 personas presentes. Identificamos 3 puntos de mejora: comunicación entre áreas, tiempos de entrega y gestión de prioridades.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'b8cc3359-fd0e-4848-bc24-d8382bf949ee'),
  '2026-05-31 17:00:00+00',
  'visto',
  'Gracias por el resumen. ¿Los 3 puntos de mejora tienen responsable asignado?',
  '2026-06-01 09:30:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'b8cc3359-fd0e-4848-bc24-d8382bf949ee'),
  'b8cc3359-fd0e-4848-bc24-d8382bf949ee',
  (SELECT persona_id FROM objetivos WHERE id = 'b8cc3359-fd0e-4848-bc24-d8382bf949ee'),
  'comentario',
  'Retrospectiva de junio realizada. Sí, los 3 puntos tienen responsable. Seguimos el formato: acción, responsable, fecha límite.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'b8cc3359-fd0e-4848-bc24-d8382bf949ee'),
  '2026-06-21 16:30:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 4] Auditoría interna Q2 — Completado / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '27c968b7-a396-4abd-a88c-e437b33162ff'),
  '27c968b7-a396-4abd-a88c-e437b33162ff',
  (SELECT persona_id FROM objetivos WHERE id = '27c968b7-a396-4abd-a88c-e437b33162ff'),
  'comentario',
  'Empecé con el relevamiento de procesos del área comercial. Encontré 2 procedimientos sin documentar. Los agrego al scope de la auditoría.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '27c968b7-a396-4abd-a88c-e437b33162ff'),
  '2025-07-10 11:00:00+00',
  'visto',
  'Bien. Tomá nota también de los procedimientos de cierre de mes, suelen tener gaps.',
  '2025-07-11 09:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '27c968b7-a396-4abd-a88c-e437b33162ff'),
  '27c968b7-a396-4abd-a88c-e437b33162ff',
  (SELECT persona_id FROM objetivos WHERE id = '27c968b7-a396-4abd-a88c-e437b33162ff'),
  'archivo',
  'Informe_Auditoria_Q2_2025.pdf',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '27c968b7-a396-4abd-a88c-e437b33162ff'),
  '2025-09-25 14:00:00+00',
  'aprobado',
  'Informe impecable. Sin observaciones críticas. Las 4 recomendaciones están muy bien fundamentadas. Excelente trabajo.',
  '2025-09-26 10:30:00+00'
);

-- [OBJ 5] Manual de procedimientos — Pendiente / visto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8'),
  'abb1c17e-bf40-4217-b6ab-3b248ac8efa8',
  (SELECT persona_id FROM objetivos WHERE id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8'),
  'comentario',
  'Armé el índice completo del manual. 12 secciones en total. Ya tengo ventas y operaciones terminadas. Empiezo finanzas la semana que viene.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8'),
  '2026-05-20 10:00:00+00',
  'visto',
  'Bien encaminado. Para finanzas coordina con Rodrigo, él tiene los procedimientos más actualizados.',
  '2026-05-21 14:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8'),
  'abb1c17e-bf40-4217-b6ab-3b248ac8efa8',
  (SELECT persona_id FROM objetivos WHERE id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8'),
  'comentario',
  'Reunión con Rodrigo realizada. Me pasó el material de finanzas. Empiezo a redactar los procedimientos esta semana.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'abb1c17e-bf40-4217-b6ab-3b248ac8efa8'),
  '2026-06-10 09:30:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 6] Encuesta clima laboral — Pendiente / sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '9af9253f-ae8d-4886-ad29-48f6cdcb1f71'),
  '9af9253f-ae8d-4886-ad29-48f6cdcb1f71',
  (SELECT persona_id FROM objetivos WHERE id = '9af9253f-ae8d-4886-ad29-48f6cdcb1f71'),
  'link',
  'https://forms.google.com/encuesta-clima-2026-borrador',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '9af9253f-ae8d-4886-ad29-48f6cdcb1f71'),
  '2026-06-05 11:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 7] Capacitación CRM — Completado / parcial
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '00fa68e0-be25-458a-a28d-f403ae78e069'),
  '00fa68e0-be25-458a-a28d-f403ae78e069',
  (SELECT persona_id FROM objetivos WHERE id = '00fa68e0-be25-458a-a28d-f403ae78e069'),
  'comentario',
  'Realicé las primeras 2 sesiones de capacitación CRM. 6 personas capacitadas. El material quedó muy bien recibido.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '00fa68e0-be25-458a-a28d-f403ae78e069'),
  '2025-10-15 16:00:00+00',
  'aprobado',
  'Muy buen avance. ¿Cuándo estimás terminar con el resto del equipo?',
  '2025-10-16 10:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '00fa68e0-be25-458a-a28d-f403ae78e069'),
  '00fa68e0-be25-458a-a28d-f403ae78e069',
  (SELECT persona_id FROM objetivos WHERE id = '00fa68e0-be25-458a-a28d-f403ae78e069'),
  'comentario',
  '8 de 10 personas capacitadas. Los 2 restantes están en licencia y los capacitaré a su regreso (estimado: enero 2026).',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '00fa68e0-be25-458a-a28d-f403ae78e069'),
  '2025-12-10 14:30:00+00',
  'visto',
  'OK. Recordame cuando los capacites para cerrar el objetivo. El 80% ya es una muy buena cobertura.',
  '2025-12-11 09:00:00+00'
);


-- ════════ LUCCA ════════

-- [OBJ 8] Lanzar versión beta de Traza — En progreso / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  '30106095-8bd1-4b91-89fc-9b23f13c0f2d',
  (SELECT persona_id FROM objetivos WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  'comentario',
  'MVP listo para pruebas internas. Deployé en Vercel con Supabase. Primeras demos con el equipo la semana que viene.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  '2026-03-10 18:00:00+00',
  'aprobado',
  'Excelente progreso. El equipo está muy entusiasmado. ¿Ya tenés las empresas piloto identificadas?',
  '2026-03-11 09:30:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  '30106095-8bd1-4b91-89fc-9b23f13c0f2d',
  (SELECT persona_id FROM objetivos WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  'link',
  'https://traza-app.vercel.app',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  '2026-04-15 12:00:00+00',
  'aprobado',
  'Beta live. Las 3 empresas piloto ya están activas y con usuarios cargados. Gran resultado.',
  '2026-04-16 10:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  '30106095-8bd1-4b91-89fc-9b23f13c0f2d',
  (SELECT persona_id FROM objetivos WHERE id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  'comentario',
  'Primer mes de beta: NPS 8.2/10, 3 empresas activas, 47 usuarios, 92% de retención semanal. Siguiendo con iteración.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '30106095-8bd1-4b91-89fc-9b23f13c0f2d'),
  '2026-05-20 17:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 9] Plan de mejora continua — En progreso / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c'),
  'dc1342d2-5159-4434-9d3a-0fd32b6cce3c',
  (SELECT persona_id FROM objetivos WHERE id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c'),
  'comentario',
  'Taller de diagnóstico realizado con el equipo. Identificamos 6 áreas de mejora con impacto directo en eficiencia operativa.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c'),
  '2026-02-20 16:00:00+00',
  'aprobado',
  'Muy buena dinámica. Las 6 áreas que identificaron son exactamente los puntos que el equipo venía mencionando informalmente.',
  '2026-02-21 10:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c'),
  'dc1342d2-5159-4434-9d3a-0fd32b6cce3c',
  (SELECT persona_id FROM objetivos WHERE id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c'),
  'comentario',
  'Implementando las primeras 3 iniciativas. Resultados preliminares: reducción de 20% en tiempo de reuniones y mejor claridad de responsabilidades.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'dc1342d2-5159-4434-9d3a-0fd32b6cce3c'),
  '2026-05-10 11:30:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 10] Certificación gestión de proyectos — Completado / parcial
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '5b630116-11ee-435d-8383-2e7020edc0cc'),
  '5b630116-11ee-435d-8383-2e7020edc0cc',
  (SELECT persona_id FROM objetivos WHERE id = '5b630116-11ee-435d-8383-2e7020edc0cc'),
  'comentario',
  'Inscripto y cursando. El programa dura 3 meses. Completé el primer módulo con nota 9/10.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '5b630116-11ee-435d-8383-2e7020edc0cc'),
  '2025-03-15 20:00:00+00',
  'visto',
  'Bien arrancado. Seguí así.',
  '2025-03-16 09:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '5b630116-11ee-435d-8383-2e7020edc0cc'),
  '5b630116-11ee-435d-8383-2e7020edc0cc',
  (SELECT persona_id FROM objetivos WHERE id = '5b630116-11ee-435d-8383-2e7020edc0cc'),
  'archivo',
  'Certificado_PMP_Lucca_2025.pdf',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '5b630116-11ee-435d-8383-2e7020edc0cc'),
  '2025-06-25 10:00:00+00',
  'visto',
  'Felicitaciones por la certificación. La nota final es buena. ¿Qué aspectos sentís que tenés para reforzar?',
  '2025-06-26 09:30:00+00'
);

-- [OBJ 11] Curso de liderazgo — En progreso / sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '15973804-ee0e-42ec-9538-083c86c63f92'),
  '15973804-ee0e-42ec-9538-083c86c63f92',
  (SELECT persona_id FROM objetivos WHERE id = '15973804-ee0e-42ec-9538-083c86c63f92'),
  'comentario',
  'Completé el módulo de liderazgo situacional. Apliqué el modelo con 2 personas del equipo esta semana. Resultado muy positivo.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '15973804-ee0e-42ec-9538-083c86c63f92'),
  '2026-05-28 19:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 12] Documentar procesos del área — Completado / visto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'a1625fa7-d1de-4228-a2c9-cab2d562c9b2'),
  'a1625fa7-d1de-4228-a2c9-cab2d562c9b2',
  (SELECT persona_id FROM objetivos WHERE id = 'a1625fa7-d1de-4228-a2c9-cab2d562c9b2'),
  'link',
  'https://notion.so/traza/procesos-del-area',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'a1625fa7-d1de-4228-a2c9-cab2d562c9b2'),
  '2025-11-30 15:00:00+00',
  'visto',
  'Muy bien estructurado. Lo comparto con el resto de los líderes como referencia. Excelente trabajo.',
  '2025-12-01 10:00:00+00'
);

-- [OBJ 13] Mejorar presentaciones ejecutivas — Pendiente / sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '3286c6b5-ac04-4907-82c7-5dec0b9bf686'),
  '3286c6b5-ac04-4907-82c7-5dec0b9bf686',
  (SELECT persona_id FROM objetivos WHERE id = '3286c6b5-ac04-4907-82c7-5dec0b9bf686'),
  'comentario',
  'Empecé a hacer presentaciones de práctica con el equipo. Feedback: mejoré en claridad pero sigo trabajando en el timing del cierre.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '3286c6b5-ac04-4907-82c7-5dec0b9bf686'),
  '2026-06-18 11:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 14] OKRs Q3 — En progreso / visto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3'),
  '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3',
  (SELECT persona_id FROM objetivos WHERE id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3'),
  'comentario',
  'Sesión de OKRs realizada con todo el equipo (4hs). Definimos 3 objetivos de empresa y 12 resultados clave. Buen nivel de alineación.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3'),
  '2026-06-05 18:00:00+00',
  'visto',
  'Bien. Pasame el documento cuando esté listo para validar antes de presentar a dirección.',
  '2026-06-06 09:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3'),
  '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3',
  (SELECT persona_id FROM objetivos WHERE id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3'),
  'link',
  'https://docs.google.com/spreadsheets/okrs-q3-2026',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '2ee027e0-d6f7-4b83-bceb-dfba1f3961d3'),
  '2026-06-12 10:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 15] Implementar TRAZA en el equipo — En progreso / mixto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '4f2320a7-883c-4ef1-9e37-1702b51259b9'),
  '4f2320a7-883c-4ef1-9e37-1702b51259b9',
  (SELECT persona_id FROM objetivos WHERE id = '4f2320a7-883c-4ef1-9e37-1702b51259b9'),
  'comentario',
  'Onboarding del equipo a TRAZA completado. 18 de 22 usuarios activos. Los 4 restantes en proceso de alta.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '4f2320a7-883c-4ef1-9e37-1702b51259b9'),
  '2026-05-30 17:30:00+00',
  'visto',
  'Muy bien. El 82% de adopción en el primer mes es un resultado excelente. ¿Cómo viene el engagement?',
  '2026-05-31 10:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '4f2320a7-883c-4ef1-9e37-1702b51259b9'),
  '4f2320a7-883c-4ef1-9e37-1702b51259b9',
  (SELECT persona_id FROM objetivos WHERE id = '4f2320a7-883c-4ef1-9e37-1702b51259b9'),
  'comentario',
  'Los 22 usuarios ya activos. Engagement: promedio de 3 logins semanales por persona. Están cargando objetivos y avances de forma autónoma.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '4f2320a7-883c-4ef1-9e37-1702b51259b9'),
  '2026-06-15 11:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 16] Presentación Q1 a dirección — Completado / visto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'c32c98d8-9f5f-4910-a37b-51d0adfd7a31'),
  'c32c98d8-9f5f-4910-a37b-51d0adfd7a31',
  (SELECT persona_id FROM objetivos WHERE id = 'c32c98d8-9f5f-4910-a37b-51d0adfd7a31'),
  'comentario',
  'Presentación de resultados Q1 ante directorio. 45 minutos. Q1 cerró en verde en todos los KPIs principales. El directorio aprobó presupuesto Q2.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'c32c98d8-9f5f-4910-a37b-51d0adfd7a31'),
  '2025-03-28 17:00:00+00',
  'visto',
  'Muy bien presentado. El directorio quedó muy conforme. Q2 ya tiene luz verde.',
  '2025-03-29 09:30:00+00'
);

-- [OBJ 17] Evaluar herramientas comunicación — Pendiente / sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '3dde24f9-c920-47f9-937e-9fb478caef1e'),
  '3dde24f9-c920-47f9-937e-9fb478caef1e',
  (SELECT persona_id FROM objetivos WHERE id = '3dde24f9-c920-47f9-937e-9fb478caef1e'),
  'comentario',
  'Evalué Slack, Teams, Loom y Notion. Criterios: costo, curva de aprendizaje, integraciones y adopción estimada. Me falta Miro y una opción open source.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '3dde24f9-c920-47f9-937e-9fb478caef1e'),
  '2026-06-20 10:30:00+00',
  'sin_revisar',
  NULL,
  NULL
);


-- ════════ ANA ════════

-- [OBJ 18] Onboarding nuevos ingresos — Completado / visto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'd026bd24-5b25-4932-9298-7e56bc690fa1'),
  'd026bd24-5b25-4932-9298-7e56bc690fa1',
  (SELECT persona_id FROM objetivos WHERE id = 'd026bd24-5b25-4932-9298-7e56bc690fa1'),
  'comentario',
  'Diseñé el proceso de onboarding en 4 etapas: bienvenida, sistemas, cultura y primeras tareas. Validado internamente con RRHH.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'd026bd24-5b25-4932-9298-7e56bc690fa1'),
  '2025-09-10 11:00:00+00',
  'visto',
  'Muy bien estructurado. Las 4 etapas tienen sentido lógico. Cuando tengas el primer ingreso aplicando el proceso, avisame.',
  '2025-09-11 10:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'd026bd24-5b25-4932-9298-7e56bc690fa1'),
  'd026bd24-5b25-4932-9298-7e56bc690fa1',
  (SELECT persona_id FROM objetivos WHERE id = 'd026bd24-5b25-4932-9298-7e56bc690fa1'),
  'comentario',
  '4 personas ya pasaron por el nuevo onboarding. Tiempo de integración: de 2 semanas a 5 días promedio. El feedback de los ingresos fue muy positivo.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'd026bd24-5b25-4932-9298-7e56bc690fa1'),
  '2025-11-20 15:00:00+00',
  'visto',
  'Excelente Ana. Reducir 9 días el tiempo de integración es un impacto real. Buen trabajo.',
  '2025-11-21 10:00:00+00'
);

-- [OBJ 19] Capacitación herramientas de gestión — En progreso / sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'a9617ec6-762f-44dc-b143-8c7710ba0666'),
  'a9617ec6-762f-44dc-b143-8c7710ba0666',
  (SELECT persona_id FROM objetivos WHERE id = 'a9617ec6-762f-44dc-b143-8c7710ba0666'),
  'comentario',
  'Completé módulos 1 y 2 del curso. Módulo 1: fundamentos de gestión de proyectos. Módulo 2: herramientas ágiles. Muy práctico.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'a9617ec6-762f-44dc-b143-8c7710ba0666'),
  '2026-06-10 20:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 20] Mejorar habilidades presentación (continuo) — sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '50a37ec2-6c7a-4d40-9697-694b12cbd844'),
  '50a37ec2-6c7a-4d40-9697-694b12cbd844',
  (SELECT persona_id FROM objetivos WHERE id = '50a37ec2-6c7a-4d40-9697-694b12cbd844'),
  'comentario',
  'Practico dos veces por semana con el equipo. Grabé una presentación de 10 minutos para autoevaluarme. Noto mejora real en estructura y claridad.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '50a37ec2-6c7a-4d40-9697-694b12cbd844'),
  '2026-06-17 18:30:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 21] Reducir tiempo de respuesta — Completado / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'cb07338a-a10f-4a60-8039-59f92a22d434'),
  'cb07338a-a10f-4a60-8039-59f92a22d434',
  (SELECT persona_id FROM objetivos WHERE id = 'cb07338a-a10f-4a60-8039-59f92a22d434'),
  'comentario',
  'Implementamos sistema de triage: urgente (respuesta < 30min), normal (< 2hs), baja prioridad (< 1 día). El equipo lo adoptó bien.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'cb07338a-a10f-4a60-8039-59f92a22d434'),
  '2025-09-05 14:00:00+00',
  'aprobado',
  'El sistema de triage es exactamente lo que necesitábamos. Bien ejecutado.',
  '2025-09-06 10:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'cb07338a-a10f-4a60-8039-59f92a22d434'),
  'cb07338a-a10f-4a60-8039-59f92a22d434',
  (SELECT persona_id FROM objetivos WHERE id = 'cb07338a-a10f-4a60-8039-59f92a22d434'),
  'comentario',
  'Resultado final: tiempo promedio de respuesta bajó de 4hs a 1.5hs. Reducción del 62%. Las consultas urgentes se resuelven en promedio en 22 minutos.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'cb07338a-a10f-4a60-8039-59f92a22d434'),
  '2025-12-20 16:00:00+00',
  'aprobado',
  '62% de reducción es un resultado excepcional. Superaste ampliamente el objetivo. Cerramos esto con muy buena nota.',
  '2025-12-21 10:00:00+00'
);

-- [OBJ 22] Team building — En progreso / visto
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '41eb6f93-d470-4290-a784-6d0f74bddb07'),
  '41eb6f93-d470-4290-a784-6d0f74bddb07',
  (SELECT persona_id FROM objetivos WHERE id = '41eb6f93-d470-4290-a784-6d0f74bddb07'),
  'comentario',
  'Fecha definida: 18/07. Venue reservado. Actividad elegida: escape room + almuerzo. Confirmación actual: 19 de 22 personas.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '41eb6f93-d470-4290-a784-6d0f74bddb07'),
  '2026-06-18 12:00:00+00',
  'visto',
  'Perfecto. El escape room es una buena elección, genera mucho team work. ¿Qué presupuesto necesitás?',
  '2026-06-19 09:00:00+00'
);

-- [OBJ 23] Relevar necesidades capacitación — Pendiente / sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'd61418b4-ee1b-400f-9e77-a232623c1dbf'),
  'd61418b4-ee1b-400f-9e77-a232623c1dbf',
  (SELECT persona_id FROM objetivos WHERE id = 'd61418b4-ee1b-400f-9e77-a232623c1dbf'),
  'comentario',
  'Relevé Ventas, Operaciones, Marketing y Customer Success. Necesidades principales: liderazgo, herramientas digitales y comunicación efectiva.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'd61418b4-ee1b-400f-9e77-a232623c1dbf'),
  '2026-06-20 15:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 24] Políticas trabajo remoto — Pendiente / sin_revisar
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'c1cec87d-8aa2-4e70-828f-95587e3a2980'),
  'c1cec87d-8aa2-4e70-828f-95587e3a2980',
  (SELECT persona_id FROM objetivos WHERE id = 'c1cec87d-8aa2-4e70-828f-95587e3a2980'),
  'link',
  'https://docs.google.com/document/politica-trabajo-remoto-borrador',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'c1cec87d-8aa2-4e70-828f-95587e3a2980'),
  '2026-06-12 11:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 25] Plan de beneficios 2026 — Completado / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b'),
  'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b',
  (SELECT persona_id FROM objetivos WHERE id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b'),
  'comentario',
  'Investigué benchmarks del mercado local en los 4 ejes: bienestar, retención, desarrollo y reconocimiento. Benchmark listo para estructurar el plan.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b'),
  '2026-04-10 14:00:00+00',
  'aprobado',
  'Excelente base. Los 4 ejes están muy bien elegidos. Seguí con la propuesta concreta para cada uno.',
  '2026-04-11 10:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b'),
  'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b',
  (SELECT persona_id FROM objetivos WHERE id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b'),
  'archivo',
  'Plan_Beneficios_2026_Final.pdf',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = 'e2aa1bc0-e594-4b30-9df6-1071f46fdb4b'),
  '2026-06-05 16:00:00+00',
  'aprobado',
  'Plan muy completo y bien fundamentado. Lo presentamos a dirección la semana que viene. Muy buen trabajo.',
  '2026-06-06 10:00:00+00'
);


-- ════════ JUAN ════════

-- [OBJ 26] Reuniones semanales equipo (continuo) — aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '32fa4239-4de0-4628-a23f-d436be826124'),
  '32fa4239-4de0-4628-a23f-d436be826124',
  (SELECT persona_id FROM objetivos WHERE id = '32fa4239-4de0-4628-a23f-d436be826124'),
  'comentario',
  'Reuniones establecidas todos los lunes 9:00–9:30hs. Formato fijo: estado del área, bloqueos y prioridades de la semana. Asistencia promedio: 95%.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '32fa4239-4de0-4628-a23f-d436be826124'),
  '2026-04-01 10:00:00+00',
  'aprobado',
  'Muy bien Juan. La consistencia en el formato ayuda mucho. El equipo sabe qué esperar cada semana.',
  '2026-04-02 09:00:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '32fa4239-4de0-4628-a23f-d436be826124'),
  '32fa4239-4de0-4628-a23f-d436be826124',
  (SELECT persona_id FROM objetivos WHERE id = '32fa4239-4de0-4628-a23f-d436be826124'),
  'comentario',
  'Incorporamos una sección de logros de la semana anterior. El equipo valora el reconocimiento público. Mejoró el ánimo general.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '32fa4239-4de0-4628-a23f-d436be826124'),
  '2026-06-10 10:00:00+00',
  'sin_revisar',
  NULL,
  NULL
);

-- [OBJ 27] Reducir tiempos respuesta cliente — Completado / aprobado
INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266'),
  '00af4bbb-0885-4fbf-bc30-1e5f12f34266',
  (SELECT persona_id FROM objetivos WHERE id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266'),
  'comentario',
  'Implementamos triage de tickets por urgencia y sistema de turnos en guardia. Primera semana: tiempo promedio bajó de 5hs a 2.5hs.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266'),
  '2025-06-10 16:00:00+00',
  'aprobado',
  'Resultado muy sólido en la primera semana. ¿El equipo adoptó el triage sin fricción?',
  '2025-06-11 09:30:00+00'
);

INSERT INTO objetivo_avances (empresa_id, objetivo_id, persona_id, tipo, contenido, creado_por, creado_en, estado_revision, respuesta_supervisor, respondido_en) VALUES
(
  (SELECT empresa_id FROM objetivos WHERE id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266'),
  '00af4bbb-0885-4fbf-bc30-1e5f12f34266',
  (SELECT persona_id FROM objetivos WHERE id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266'),
  'comentario',
  'Resultado final a 2 meses: tiempo promedio 1.8hs (reducción del 64%). Satisfacción del cliente interno subió de 6.2 a 8.4/10.',
  (SELECT COALESCE(p.user_id, (SELECT id FROM auth.users LIMIT 1)) FROM personas p JOIN objetivos o ON o.persona_id = p.id WHERE o.id = '00af4bbb-0885-4fbf-bc30-1e5f12f34266'),
  '2025-08-28 15:30:00+00',
  'aprobado',
  'Resultados impresionantes Juan. 64% de reducción y +2.2 puntos de satisfacción. Objetivo superado ampliamente.',
  '2025-08-29 10:00:00+00'
);

-- ── FIN ──────────────────────────────────────────────────────
-- Resumen: 27 objetivos actualizados, 52 avances insertados
-- con variedad de tipos, estados de revisión y fechas.
