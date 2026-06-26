-- ============================================================
-- TRAZA — Simulación de Historial Multi-Empresa
-- ============================================================
-- REQUISITO PREVIO: ejecutar arquitectura-portable.sql primero
-- ============================================================

DO $$
DECLARE
  emp_petroleo  uuid := gen_random_uuid();
  emp_contable  uuid := gen_random_uuid();
  p             RECORD;
  hist_id_1     uuid;
  hist_id_2     uuid;
  empresa_act   uuid;
  cargo_1       text;
  cargo_2       text;
BEGIN

  -- Empresa actual: la que tiene más personas
  SELECT empresa_id INTO empresa_act
  FROM personas
  GROUP BY empresa_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RAISE NOTICE 'Empresa actual: %', empresa_act;

  -- Insertar 2 empresas históricas ficticias
  INSERT INTO empresas (id, nombre, rubro) VALUES
    (emp_petroleo, 'YPF Servicios Digitales S.A.', 'Petróleo y Gas'),
    (emp_contable, 'Estudio Contable Rosario & Partners', 'Contabilidad y Finanzas');

  -- Marcar personas actuales como activas
  UPDATE personas
  SET empleo_activo = true,
      fecha_inicio_empleo = COALESCE(fecha_inicio_empleo, '2024-01-15')
  WHERE empresa_id = empresa_act;

  -- Iterar sobre cada persona actual y crear su historial
  FOR p IN
    SELECT * FROM personas WHERE empresa_id = empresa_act ORDER BY nombre
  LOOP
    RAISE NOTICE 'Procesando: % %', p.nombre, p.apellido;

    -- Determinar cargos anteriores progresivos
    cargo_1 := CASE
      WHEN p.cargo ILIKE '%Director%' OR p.cargo ILIKE '%Gerente%' THEN 'Jefe de Área'
      WHEN p.cargo ILIKE '%Jefe%' OR p.cargo ILIKE '%Coordinador%' THEN 'Analista Senior'
      ELSE 'Analista'
    END;

    cargo_2 := CASE
      WHEN p.cargo ILIKE '%Director%' OR p.cargo ILIKE '%Gerente%' THEN 'Analista Senior'
      WHEN p.cargo ILIKE '%Jefe%' OR p.cargo ILIKE '%Coordinador%' THEN 'Analista Junior'
      ELSE 'Analista Junior'
    END;

    -- ── EMPRESA 1: YPF Servicios Digitales (2021–2023) ───────────────
    INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
    VALUES (emp_petroleo, p.nombre, p.apellido, cargo_1, COALESCE(p.area, 'Operaciones'), p.traza_id, false, '2021-04-01', '2023-11-30')
    RETURNING id INTO hist_id_1;

    INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
    VALUES
      (emp_petroleo, hist_id_1, 'Digitalización de procesos operativos de campo', 'Completado', 'De acuerdo', 100, 'Alta', '2021-09-30', 'Asignado', 'Resultado', false),
      (emp_petroleo, hist_id_1, 'Capacitación en seguridad operacional ISO 45001', 'Completado', 'De acuerdo', 100, 'Alta', '2021-12-31', 'Asignado', 'Aprendizaje', false),
      (emp_petroleo, hist_id_1, 'Reducción 25% tiempos de reporte de gestión', 'Completado', 'De acuerdo', 100, 'Media', '2022-06-30', 'Asignado', 'Eficiencia', false),
      (emp_petroleo, hist_id_1, 'Tableros de control para gerencia regional', 'Completado', 'Parcialmente de acuerdo', 80, 'Alta', '2022-12-31', 'Asignado', 'Resultado', false),
      (emp_petroleo, hist_id_1, 'Mentoría a nuevos ingresantes del área', 'Completado', 'De acuerdo', 100, 'Media', '2023-06-30', 'Personal', 'Hábito', false),
      (emp_petroleo, hist_id_1, 'Migración de base de datos a plataforma cloud', 'Completado', 'De acuerdo', 100, 'Alta', '2023-10-31', 'Asignado', 'Resultado', false);

    -- ── EMPRESA 2: Estudio Contable (2019–2021) ──────────────────────
    INSERT INTO personas (empresa_id, nombre, apellido, cargo, area, traza_id, empleo_activo, fecha_inicio_empleo, fecha_fin_empleo)
    VALUES (emp_contable, p.nombre, p.apellido, cargo_2, COALESCE(p.area, 'Administración'), p.traza_id, false, '2019-02-01', '2021-03-31')
    RETURNING id INTO hist_id_2;

    INSERT INTO objetivos (empresa_id, persona_id, titulo, estado, validacion, progreso, prioridad, fecha_limite, tipo, categoria, es_continuo)
    VALUES
      (emp_contable, hist_id_2, 'Auditoría de procesos internos de facturación', 'Completado', 'De acuerdo', 100, 'Alta', '2019-09-30', 'Asignado', 'Resultado', false),
      (emp_contable, hist_id_2, 'Certificación en normativa impositiva AFIP', 'Completado', 'De acuerdo', 100, 'Media', '2019-12-31', 'Personal', 'Aprendizaje', false),
      (emp_contable, hist_id_2, 'Migración de clientes al nuevo sistema de gestión', 'Completado', 'Parcialmente de acuerdo', 85, 'Alta', '2020-06-30', 'Asignado', 'Resultado', false),
      (emp_contable, hist_id_2, 'Sistema de seguimiento de vencimientos fiscales', 'Completado', 'De acuerdo', 100, 'Media', '2020-12-31', 'Asignado', 'Hábito', false),
      (emp_contable, hist_id_2, 'Apoyo en cierre de ejercicio contable anual', 'Completado', 'De acuerdo', 100, 'Alta', '2021-02-28', 'Asignado', 'Resultado', false);

  END LOOP;

  RAISE NOTICE '✓ Historial multi-empresa insertado correctamente.';
END $$;

-- ── Política RLS para que la credencial pública pueda leer historial ──
-- (ejecutar por separado si da error dentro del DO block)
CREATE POLICY IF NOT EXISTS "Credencial pública por traza_id"
  ON personas FOR SELECT
  USING (traza_id IS NOT NULL);
