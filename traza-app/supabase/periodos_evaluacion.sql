-- Períodos de evaluación
create table if not exists periodos_evaluacion (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references empresas(id) on delete cascade,
  nombre      text not null,
  tipo        text not null default 'trimestral', -- mensual | trimestral | semestral | anual
  fecha_inicio date not null,
  fecha_fin    date not null,
  estado       text not null default 'abierto',   -- abierto | cerrado
  cerrado_por  uuid references auth.users(id),
  cerrado_en   timestamptz,
  created_at   timestamptz default now()
);

alter table periodos_evaluacion enable row level security;

create policy "Ver de su empresa" on periodos_evaluacion for select
  using (empresa_id in (select empresa_id from profiles where id = auth.uid()));

create policy "Insertar" on periodos_evaluacion for insert
  with check (empresa_id in (select empresa_id from profiles where id = auth.uid()));

create policy "Actualizar" on periodos_evaluacion for update
  using (empresa_id in (select empresa_id from profiles where id = auth.uid()));

-- Resúmenes por empleado por período
create table if not exists resumen_periodo_empleado (
  id              uuid primary key default gen_random_uuid(),
  periodo_id      uuid references periodos_evaluacion(id) on delete cascade,
  empresa_id      uuid references empresas(id),
  persona_id      uuid references personas(id),
  score           integer not null default 0,
  total_objetivos integer not null default 0,
  completados     integer not null default 0,
  cumplimiento    numeric not null default 0,
  validados       integer not null default 0,
  parciales       integer not null default 0,
  rechazados      integer not null default 0,
  estado_general  text not null default 'Sin datos', -- Cumplió | Cumplió parcialmente | No cumplió | Sin datos
  created_at      timestamptz default now()
);

alter table resumen_periodo_empleado enable row level security;

create policy "Ver de su empresa" on resumen_periodo_empleado for select
  using (empresa_id in (select empresa_id from profiles where id = auth.uid()));

create policy "Insertar" on resumen_periodo_empleado for insert
  with check (true);
