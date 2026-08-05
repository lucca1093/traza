-- ═══════════════════════════════════════════════════════════
-- TRAZA — Migración: tendencias de score + plan y plazas
-- Correr en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Tabla score_historico: snapshot diario del Índice Traza por persona
create table if not exists score_historico (
  id          uuid        primary key default gen_random_uuid(),
  persona_id  uuid        not null references personas(id) on delete cascade,
  empresa_id  uuid        references empresas(id) on delete cascade,
  score       integer     not null check (score >= 0 and score <= 100),
  fecha       date        not null default current_date,
  created_at  timestamptz default now(),
  unique(persona_id, fecha)  -- un snapshot por persona por día
);

create index if not exists idx_score_historico_persona_fecha
  on score_historico(persona_id, fecha desc);

-- RLS: cada usuario ve solo su propio historial
alter table score_historico enable row level security;

create policy "usuario ve su propio historial"
  on score_historico for select
  using (
    persona_id in (
      select id from personas where user_id = auth.uid()
    )
  );

create policy "usuario inserta su propio historial"
  on score_historico for insert
  with check (
    persona_id in (
      select id from personas where user_id = auth.uid()
    )
  );

-- Admins y supervisors ven el historial de su empresa
create policy "empresa ve historial de sus personas"
  on score_historico for select
  using (
    empresa_id in (
      select empresa_id from profiles where id = auth.uid()
    )
  );

-- 2. Agregar plan y límite de plazas a empresas
alter table empresas
  add column if not exists plan        text    not null default 'starter',
  add column if not exists max_plazas  integer not null default 10;
