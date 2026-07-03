-- Tabla de notificaciones
create table if not exists notificaciones (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references empresas(id) on delete cascade,
  persona_id  uuid references personas(id) on delete cascade,
  tipo        text not null,
  objetivo_id uuid references objetivos(id) on delete cascade,
  mensaje     text not null,
  leida       boolean default false,
  creado_en   timestamptz default now()
);

alter table notificaciones enable row level security;

create policy "Ver propias" on notificaciones for select
  using (persona_id in (select id from personas where user_id = auth.uid()));

create policy "Insertar" on notificaciones for insert
  with check (true);

create policy "Marcar leida" on notificaciones for update
  using (persona_id in (select id from personas where user_id = auth.uid()));
