-- ═══════════════════════════════════════════════════════════════
-- FIX: Mi Equipo — Diego Sánchez (Manager Demo)
-- Pegar y ejecutar completo en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

DO $fix$
DECLARE
  v_uid  uuid;
  v_mid  uuid := '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'; -- Grupo Meridian
  v_pid  uuid := 'dddddddd-dddd-4ddd-dddd-000000000003'; -- persona de Diego (fija)
BEGIN

  -- 1. Buscar el auth user de Diego por email (no asumimos UUID fijo)
  SELECT id INTO v_uid
  FROM auth.users
  WHERE email = 'demo-mgr@traza.app'
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario demo-mgr@traza.app no encontrado. Corré demo_users.sql primero.';
  END IF;

  RAISE NOTICE 'Diego auth UID: %', v_uid;

  -- 2. Crear/actualizar profile de Diego
  INSERT INTO public.profiles (id, nombre, apellido, cargo, area, rol, empresa_id)
  VALUES (v_uid, 'Diego', 'Sánchez', 'Director de RRHH', 'RRHH', 'supervisor', v_mid)
  ON CONFLICT (id) DO UPDATE
    SET empresa_id = v_mid,
        rol        = 'supervisor';

  -- 3. Limpiar personas duplicadas (si existen) — dejar solo la de ID fijo
  DELETE FROM public.personas
   WHERE user_id = v_uid
     AND empresa_id = v_mid
     AND id != v_pid;

  -- 4. Crear/actualizar persona de Diego con ID fijo
  INSERT INTO public.personas (
    id, user_id, nombre, apellido, cargo, area,
    empresa_id, tipo_cuenta, empleo_activo,
    traza_id, credencial_publica, supervisor_verificado
  ) VALUES (
    v_pid, v_uid, 'Diego', 'Sánchez',
    'Director de RRHH', 'RRHH',
    v_mid, 'empresa', true,
    'TRZ-DEMO-DGO', false, true
  )
  ON CONFLICT (id) DO UPDATE
    SET empleo_activo         = true,
        supervisor_verificado = true,
        user_id               = v_uid,
        empresa_id            = v_mid;

  -- 5. Asignar equipo directo a Diego
  UPDATE public.personas
     SET supervisor_id = v_pid,
         empleo_activo = true
   WHERE empresa_id = v_mid
     AND (nombre, apellido) IN (
       ('Camila',   'Ortega'),
       ('Gonzalo',  'Sánchez'),
       ('Emiliano', 'Vidal'),
       ('Santiago', 'Ibáñez')
     );

  RAISE NOTICE 'Listo — Diego persona: %, 4 reportes asignados.', v_pid;
END $fix$;

-- ── Verificación: debe mostrar 4 personas con supervisor "Diego Sánchez" ──
SELECT
  COALESCE(d.nombre || ' ' || d.apellido, '(sin supervisor)') AS supervisor,
  p.nombre || ' ' || p.apellido AS colaborador,
  p.cargo,
  p.empleo_activo
FROM public.personas p
LEFT JOIN public.personas d ON d.id = p.supervisor_id
WHERE p.empresa_id = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
  AND p.empleo_activo = true
ORDER BY supervisor, p.apellido;
