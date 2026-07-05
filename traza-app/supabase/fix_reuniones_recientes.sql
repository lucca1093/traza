-- ═══════════════════════════════════════════════════════════════
-- FIX_REUNIONES_RECIENTES.SQL
-- Agrega reuniones de junio 2026 para que "última reunión"
-- muestre pocos días, no 300+
-- ═══════════════════════════════════════════════════════════════

-- Luciana Ferreyra ↔ Diego Molina
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Diego'   AND apellido = 'Molina'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra'),
  '2026-06-19'::date,
  'Revisión H1 2026 + planificación Q3',
  'Luciana cerró H1 2026 con tasa de conversión promedio del 41%, superando el objetivo del 40% por primera vez. Pipeline actual: 68 leads activos (por encima de los 50 del objetivo). Programa de fidelización: 18 de 20 clientes activos, los 2 restantes se incorporan en julio. Conversación sobre carrera: proponemos la promoción a Senior Ejecutiva de Cuentas para agosto.',
  'Luciana prepara el análisis de impacto H1 para presentar en la reunión de directores del 30/6. Diego inicia el proceso formal de promoción con RRHH. Próxima revisión: 17/7.',
  NULL, '2026-07-17'::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Luciana' AND apellido = 'Ferreyra')
    AND fecha = '2026-06-19'::date
);

-- Camila Ortega ↔ Diego Molina
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Diego'  AND apellido = 'Molina'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Camila' AND apellido = 'Ortega'),
  '2026-06-12'::date,
  'Balance Q2 + resultados Green Belt',
  'Camila obtuvo la certificación Lean Six Sigma Green Belt con 94/100. Aplicó metodología en el proyecto de inventario: redujo el stockout en un 31%. El SLA de despacho mantiene 96% de cumplimiento. Está coordinando el rollout del sistema de mejora continua a las áreas de RRHH y Tecnología.',
  'Camila lidera el workshop de mejora continua para RRHH y Tecnología en julio. Diego la propone como referente de procesos ante la dirección. Próxima 1:1: 10/7.',
  NULL, '2026-07-10'::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Camila' AND apellido = 'Ortega')
    AND fecha = '2026-06-12'::date
);

-- Valentina Cruz ↔ Sofía Reynoso
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Sofía'     AND apellido = 'Reynoso'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Valentina' AND apellido = 'Cruz'),
  '2026-06-25'::date,
  'Cierre Q2 2026 + planificación H2',
  'Valentina cerró Q2 al 124% de cuota, el mejor trimestre de su carrera. La precisión del forecast se mantiene en 86%. Lideró el onboarding del nuevo representante de ventas con muy buenos resultados. Para H2: la promoción a Team Lead está en evaluación formal.',
  'Sofía inicia el proceso de promoción a Team Lead de Ventas. Valentina prepara el plan de carrera y las metas del nuevo rol. Próxima 1:1: 23/7.',
  NULL, '2026-07-23'::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Valentina' AND apellido = 'Cruz')
    AND fecha = '2026-06-25'::date
);

-- Martín Aguirre ↔ Sofía Reynoso
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Sofía'  AND apellido = 'Reynoso'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Martín' AND apellido = 'Aguirre'),
  '2026-06-18'::date,
  'Revisión cuentas clave + Salesforce Champion H1',
  'Las 3 cuentas clave tienen NPS promedio de 9.2. Martín publicó el playbook de Salesforce: ya lo usan 8 personas del equipo. Cerró el primer upsell generado directamente desde el plan de adoption (28k ARR extra). Propone incorporar automatizaciones de CRM para reducir carga administrativa del equipo.',
  'Martín presenta las automatizaciones propuestas al equipo en julio. Sofía aprueba presupuesto para 2 licencias adicionales de Salesforce para el equipo. Próxima 1:1: 16/7.',
  NULL, '2026-07-16'::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Martín' AND apellido = 'Aguirre')
    AND fecha = '2026-06-18'::date
);

-- Florencia Herrera ↔ Sofía Reynoso
INSERT INTO reuniones_1on1
  (empresa_id, supervisor_id, empleado_id, fecha, agenda, notas, acuerdos, objetivo_id, proxima_reunion, created_by)
SELECT
  '4ffe2f78-5a3f-47c5-82b7-f903e6a39406',
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Sofía'     AND apellido = 'Reynoso'),
  (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Florencia' AND apellido = 'Herrera'),
  '2026-06-23'::date,
  'Modelo People Partner + segunda cohorte liderazgo',
  'La segunda cohorte del track de liderazgo tiene 6 participantes (2 más que la primera). Florencia presentó el modelo de People Partner por área: aprobado por los directores. Va a ser implementado en Q3. El tiempo de rampa promedio de los ingresos bajó a 18 días (histórico: 45).',
  'Florencia lidera la implementación del modelo People Partner en Q3. Sofía presenta el caso a la dirección como best practice. Próxima 1:1: 21/7.',
  NULL, '2026-07-21'::date,
  (SELECT id FROM profiles WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM reuniones_1on1
  WHERE empleado_id = (SELECT id FROM personas WHERE empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406' AND nombre = 'Florencia' AND apellido = 'Herrera')
    AND fecha = '2026-06-23'::date
);

-- ──────────────────────────────────────────────────────────────
-- VERIFICAR ROL del Admin Demo (Sofía Reynoso)
-- Si el resultado dice algo distinto a 'admin', hay que corregirlo
-- ──────────────────────────────────────────────────────────────
SELECT p.id, p.rol, p.nombre, p.apellido
FROM profiles p
WHERE p.empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
ORDER BY p.rol;
