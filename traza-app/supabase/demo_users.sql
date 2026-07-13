-- ============================================================
-- TRAZA — Demo Users + Data (v3 — schema correcto)
-- Ejecutar COMPLETO en Supabase SQL Editor
-- ============================================================
-- Credenciales:
--   demo-pro@traza.app  / TrazaDemo2024!  → Nicolás Romero (Profesional)
--   demo-emp@traza.app  / TrazaDemo2024!  → Martín Aguirre (Empleado)
--   demo-mgr@traza.app  / TrazaDemo2024!  → Diego Sánchez  (Manager)
-- ============================================================

-- ── 0. Limpiar demo existente ──────────────────────────────
DELETE FROM cierres_semanales WHERE persona_id IN (
  'aaaaaaaa-aaaa-4aaa-aaaa-000000000001'::uuid,
  'bbbbbbbb-bbbb-4bbb-bbbb-000000000002'::uuid
);
DELETE FROM objetivo_avances WHERE persona_id IN (
  'aaaaaaaa-aaaa-4aaa-aaaa-000000000001'::uuid,
  'bbbbbbbb-bbbb-4bbb-bbbb-000000000002'::uuid
);
DELETE FROM validaciones_externas WHERE objetivo_id IN (
  'cc000001-cc00-4000-a000-000000000001'::uuid,
  'cc000002-cc00-4000-a000-000000000001'::uuid,
  'cc000003-cc00-4000-a000-000000000001'::uuid,
  'cc000004-cc00-4000-a000-000000000001'::uuid
);
DELETE FROM objetivos WHERE persona_id IN (
  'aaaaaaaa-aaaa-4aaa-aaaa-000000000001'::uuid,
  'bbbbbbbb-bbbb-4bbb-bbbb-000000000002'::uuid
);
DELETE FROM personas WHERE id IN (
  'aaaaaaaa-aaaa-4aaa-aaaa-000000000001'::uuid,
  'bbbbbbbb-bbbb-4bbb-bbbb-000000000002'::uuid
);
DELETE FROM auth.identities WHERE user_id IN (
  '10000000-0000-4000-a000-000000000001'::uuid,
  '20000000-0000-4000-a000-000000000002'::uuid,
  '30000000-0000-4000-a000-000000000003'::uuid
);
DELETE FROM auth.users WHERE id IN (
  '10000000-0000-4000-a000-000000000001'::uuid,
  '20000000-0000-4000-a000-000000000002'::uuid,
  '30000000-0000-4000-a000-000000000003'::uuid
);

-- ── 1. Auth users ──────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change_token_current, email_change_token_new,
  is_super_admin
) VALUES
(
  '10000000-0000-4000-a000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo-pro@traza.app',
  crypt('TrazaDemo2024!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Nicolás","apellido":"Romero"}',
  now(), now(), '', '', '', '', false
),
(
  '20000000-0000-4000-a000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo-emp@traza.app',
  crypt('TrazaDemo2024!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Martín","apellido":"Aguirre"}',
  now(), now(), '', '', '', '', false
),
(
  '30000000-0000-4000-a000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo-mgr@traza.app',
  crypt('TrazaDemo2024!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Diego","apellido":"Sánchez"}',
  now(), now(), '', '', '', '', false
);

-- ── 2. Auth identities ─────────────────────────────────────
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  '10000000-0000-4000-a000-000000000001',
  '{"sub":"10000000-0000-4000-a000-000000000001","email":"demo-pro@traza.app"}',
  'email', 'demo-pro@traza.app', now(), now(), now()
),
(
  gen_random_uuid(),
  '20000000-0000-4000-a000-000000000002',
  '{"sub":"20000000-0000-4000-a000-000000000002","email":"demo-emp@traza.app"}',
  'email', 'demo-emp@traza.app', now(), now(), now()
),
(
  gen_random_uuid(),
  '30000000-0000-4000-a000-000000000003',
  '{"sub":"30000000-0000-4000-a000-000000000003","email":"demo-mgr@traza.app"}',
  'email', 'demo-mgr@traza.app', now(), now(), now()
);

-- ── 3. Profiles ────────────────────────────────────────────
INSERT INTO profiles (id, nombre, apellido, cargo, area, rol, empresa_id)
VALUES
(
  '10000000-0000-4000-a000-000000000001',
  'Nicolás', 'Romero',
  'Consultor de Marketing Digital', 'Marketing',
  'individuo', NULL
),
(
  '20000000-0000-4000-a000-000000000002',
  'Martín', 'Aguirre',
  'Analista de Datos', 'Tecnología',
  'empleado', '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
),
(
  '30000000-0000-4000-a000-000000000003',
  'Diego', 'Sánchez',
  'Director de Recursos Humanos', 'RRHH',
  'supervisor', '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  cargo = EXCLUDED.cargo,
  area = EXCLUDED.area,
  rol = EXCLUDED.rol,
  empresa_id = EXCLUDED.empresa_id;

-- ── 4. Persona Nicolás (profesional independiente) ─────────
INSERT INTO personas (
  id, user_id, nombre, apellido, cargo,
  empresa_actual_nombre, traza_id, empleo_activo, tipo_cuenta
) VALUES (
  'aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
  '10000000-0000-4000-a000-000000000001',
  'Nicolás', 'Romero',
  'Consultor de Marketing Digital',
  'Digital Boost Agency',
  'TRZ-DEMO-NIC', true, 'individual'
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  traza_id = EXCLUDED.traza_id;

-- ── 5. Persona Martín (empleado Grupo Meridian) ────────────
INSERT INTO personas (
  id, user_id, nombre, apellido, cargo,
  empresa_id, traza_id, empleo_activo, tipo_cuenta
) VALUES (
  'bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
  '20000000-0000-4000-a000-000000000002',
  'Martín', 'Aguirre',
  'Analista de Datos',
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  'TRZ-DEMO-MAR', true, 'empresa'
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  traza_id = EXCLUDED.traza_id;

-- ── 6. Objetivos Nicolás ───────────────────────────────────
-- categoria válida: 'Resultado' | 'Aprendizaje' | 'Hábito'
-- columnas objetivos: id, persona_id, titulo, descripcion,
--   categoria, estado, prioridad, validacion, fecha_limite
INSERT INTO objetivos (id, persona_id, titulo, descripcion, categoria, estado, prioridad, validacion, fecha_limite)
VALUES
('cc000001-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Estrategia de contenido para cliente SaaS',
 'Diseñar y ejecutar plan de contenido de 90 días para startup B2B',
 'Resultado','Completado','Alta','De acuerdo','2024-04-15'),
('cc000002-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Campaña de awareness — LinkedIn Ads',
 'Gestionar presupuesto de $5.000 USD en LinkedIn para generación de leads',
 'Resultado','Completado','Alta','De acuerdo','2024-03-31'),
('cc000003-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Análisis competitivo de mercado fintech',
 'Benchmark de 12 competidores, entregable PDF ejecutivo',
 'Resultado','Completado','Media','De acuerdo','2024-03-31'),
('cc000004-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Rediseño de onboarding email journey',
 'Optimizar secuencia de emails post-registro. Aumentar activación +15%',
 'Resultado','Completado','Alta','De acuerdo','2024-06-30'),
('cc000005-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Certificación Google Ads',
 'Obtener certificación oficial para mejorar oferta de servicios',
 'Aprendizaje','Completado','Media','De acuerdo','2024-04-30'),
('cc000006-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Lanzamiento canal YouTube — B2B Marketing',
 'Producir 8 episodios piloto, alcanzar 500 suscriptores en 60 días',
 'Resultado','En progreso','Alta',NULL,'2024-12-31'),
('cc000007-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Propuesta de retainer mensual para cliente eCommerce',
 'Negociar y cerrar contrato de 6 meses de consultoría',
 'Resultado','En progreso','Alta',NULL,'2024-12-15'),
('cc000008-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'Portfolio profesional con casos reales',
 'Armar portfolio con métricas y resultados de los últimos 2 años',
 'Aprendizaje','Pendiente','Media',NULL,'2025-01-31')
ON CONFLICT (id) DO NOTHING;

-- ── 7. Avances Nicolás ─────────────────────────────────────
INSERT INTO objetivo_avances (id, objetivo_id, persona_id, tipo, contenido, creado_en) VALUES
(gen_random_uuid(),'cc000001-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'comentario','Finalicé el calendario editorial con 30 piezas. El cliente aprobó la estrategia en la reunión del martes.','2024-02-10'),
(gen_random_uuid(),'cc000001-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'link','https://docs.google.com/presentation/estrategia-q1','2024-03-05'),
(gen_random_uuid(),'cc000002-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'comentario','CPL promedio de $12 USD vs objetivo de $20. Superamos la meta de leads en 40%.','2024-03-28'),
(gen_random_uuid(),'cc000006-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'comentario','Grabamos los primeros 3 episodios. Edición en proceso. Canal lanzado con trailer.','2024-10-20'),
(gen_random_uuid(),'cc000006-cc00-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
 'link','https://youtube.com/@nicromero-mkt','2024-11-01');

-- ── 8. Validaciones externas Nicolás ──────────────────────
INSERT INTO validaciones_externas (id, objetivo_id, nombre_validador, email_validador, relacion_validador, comentario, confirmado, creado_en) VALUES
(gen_random_uuid(),'cc000001-cc00-4000-a000-000000000001',
 'Laura Méndez','laura.mendez@saascompany.com','Cliente / CMO',
 'Nicolás entregó exactamente lo que prometió: una estrategia sólida, bien ejecutada y con resultados medibles.',
 true,'2024-04-20'),
(gen_random_uuid(),'cc000002-cc00-4000-a000-000000000001',
 'Andrés Villalba','andres@agencia-paid.com','Colega / Especialista Paid Media',
 'El performance de la campaña fue sobresaliente. CPL muy por debajo del promedio del sector.',
 true,'2024-04-02'),
(gen_random_uuid(),'cc000004-cc00-4000-a000-000000000001',
 'Camila Torres','ctorres@techstartup.io','Cliente / CEO',
 'La nueva secuencia de emails mejoró nuestra tasa de activación del 18% al 31%.',
 true,'2024-07-05');

-- ── 9. Objetivos Martín ────────────────────────────────────
INSERT INTO objetivos (id, persona_id, empresa_id, titulo, descripcion, categoria, estado, prioridad, validacion, fecha_limite)
VALUES
('dd000001-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
 'Dashboard de métricas operacionales en Power BI',
 'Construir dashboard ejecutivo con KPIs de operaciones para gerencia',
 'Resultado','Completado','Alta','De acuerdo','2024-04-30'),
('dd000002-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
 'Migración de reportes de Excel a automatización Python',
 'Automatizar 5 reportes semanales manuales, reducir tiempo de armado en 80%',
 'Resultado','Completado','Alta','De acuerdo','2024-06-30'),
('dd000003-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
 'Modelo de forecast de ventas Q4',
 'Desarrollar modelo predictivo para planificación de inventario',
 'Resultado','En progreso','Alta',NULL,'2024-12-31'),
('dd000004-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
 'Capacitación al equipo en uso de Looker Studio',
 'Dar 3 talleres internos sobre visualización de datos',
 'Aprendizaje','En progreso','Media',NULL,'2024-11-30'),
('dd000005-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
 'Certificación en dbt (data build tool)',
 'Obtener certificación para unificar transformaciones de datos del equipo',
 'Aprendizaje','Pendiente','Media',NULL,'2025-02-28')
ON CONFLICT (id) DO NOTHING;

-- ── 10. Avances Martín ─────────────────────────────────────
INSERT INTO objetivo_avances (id, objetivo_id, persona_id, tipo, contenido, creado_en) VALUES
(gen_random_uuid(),'dd000001-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 'comentario','Dashboard terminado y presentado a gerencia. Ahora lo usan en las reuniones del lunes.','2024-04-29'),
(gen_random_uuid(),'dd000002-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 'link','https://github.com/martinaguirre/auto-reportes','2024-06-28'),
(gen_random_uuid(),'dd000003-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 'comentario','Primera versión del modelo con ARIMA. MAE del 8.3%. Ajustando variables externas.','2024-10-15'),
(gen_random_uuid(),'dd000004-dd00-4000-a000-000000000002','bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
 'comentario','Primer taller completado: 12 personas. Preparando ejercicios para la segunda sesión.','2024-10-28');

-- ── 11. Cierre semanal Martín ──────────────────────────────
INSERT INTO cierres_semanales (id, persona_id, semana, que_avance, que_obstaculos, que_necesito, creado_en)
VALUES (
  gen_random_uuid(),
  'bbbbbbbb-bbbb-4bbb-bbbb-000000000002',
  date_trunc('week', now())::date,
  'Completé la segunda iteración del modelo de forecast. Mejoré el MAE a 6.1%.',
  'El proveedor de datos externos tardó en actualizar el feed.',
  'Acceso a datos históricos de ventas de los últimos 3 años para mejorar el modelo.',
  now()
);

SELECT 'Demo users creados exitosamente ✓' AS status;
