create extension if not exists "uuid-ossp";

create table public.empresas (
  id         uuid default uuid_generate_v4() primary key,
  nombre     text not null,
  rubro      text,
  logo_url   text,
  created_at timestamp with time zone default now()
);

create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  empresa_id    uuid references public.empresas(id) on delete set null,
  nombre        text,
  apellido      text,
  cargo         text,
  area          text,
  supervisor_id uuid references public.profiles(id) on delete set null,
  rol           text not null default 'empleado' check (rol in ('super_admin','admin','supervisor','empleado')),
  avatar_url    text,
  created_at    timestamp with time zone default now()
);

create table public.personas (
  id            uuid default uuid_generate_v4() primary key,
  empresa_id    uuid references public.empresas(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete set null,
  nombre        text not null,
  apellido      text not null,
  cargo         text,
  area          text,
  supervisor_id uuid references public.personas(id) on delete set null,
  created_at    timestamp with time zone default now()
);

create table public.objetivos (
  id                    uuid default uuid_generate_v4() primary key,
  empresa_id            uuid references public.empresas(id) on delete cascade not null,
  persona_id            uuid references public.personas(id) on delete cascade,
  creado_por            uuid references public.profiles(id) on delete set null,
  titulo                text not null,
  descripcion           text,
  prioridad             text not null default 'Media' check (prioridad in ('Alta','Media','Baja')),
  fecha_limite          date,
  estado                text not null default 'Pendiente' check (estado in ('Pendiente','En progreso','Completado')),
  tipo                  text not null default 'Asignado' check (tipo in ('Asignado','Personal')),
  evidencia_url         text,
  validacion            text check (validacion in ('De acuerdo','Parcialmente de acuerdo','En desacuerdo')),
  validado_por          uuid references public.profiles(id) on delete set null,
  comentario_supervisor text,
  created_at            timestamp with time zone default now(),
  updated_at            timestamp with time zone default now()
);

create table public.evidencias (
  id          uuid default uuid_generate_v4() primary key,
  objetivo_id uuid references public.objetivos(id) on delete cascade not null,
  empresa_id  uuid references public.empresas(id) on delete cascade not null,
  tipo        text not null check (tipo in ('archivo','link')),
  url         text not null,
  nombre      text,
  created_at  timestamp with time zone default now()
);

create or replace function public.get_my_empresa_id()
returns uuid language sql security definer stable as $$
  select empresa_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select rol from public.profiles where id = auth.uid()
$$;

alter table public.empresas   enable row level security;
alter table public.profiles   enable row level security;
alter table public.personas   enable row level security;
alter table public.objetivos  enable row level security;
alter table public.evidencias enable row level security;

create policy "Ver propia empresa" on public.empresas
  for select using (id = public.get_my_empresa_id() or public.get_my_role() = 'super_admin');

create policy "Super admin gestiona empresas" on public.empresas
  for all using (public.get_my_role() = 'super_admin');

create policy "Ver propio perfil" on public.profiles
  for select using (id = auth.uid());

create policy "Admin ve perfiles de su empresa" on public.profiles
  for select using (empresa_id = public.get_my_empresa_id() and public.get_my_role() in ('admin','supervisor','super_admin'));

create policy "Actualizar propio perfil" on public.profiles
  for update using (id = auth.uid());

create policy "Admin actualiza perfiles de su empresa" on public.profiles
  for update using (empresa_id = public.get_my_empresa_id() and public.get_my_role() in ('admin','super_admin'));

create policy "Ver personas de mi empresa" on public.personas
  for select using (empresa_id = public.get_my_empresa_id());

create policy "Admin gestiona personas" on public.personas
  for all using (empresa_id = public.get_my_empresa_id() and public.get_my_role() in ('admin','super_admin'));

create policy "Ver objetivos de mi empresa" on public.objetivos
  for select using (empresa_id = public.get_my_empresa_id());

create policy "Empleado actualiza sus objetivos" on public.objetivos
  for update using (
    empresa_id = public.get_my_empresa_id()
    and (
      persona_id in (select id from public.personas where user_id = auth.uid())
      or public.get_my_role() in ('admin','supervisor','super_admin')
    )
  );

create policy "Admin y supervisor crean objetivos" on public.objetivos
  for insert with check (
    empresa_id = public.get_my_empresa_id()
    and public.get_my_role() in ('admin','supervisor','super_admin')
  );

create policy "Empleado crea objetivos personales" on public.objetivos
  for insert with check (
    empresa_id = public.get_my_empresa_id()
    and tipo = 'Personal'
    and persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Admin elimina objetivos de su empresa" on public.objetivos
  for delete using (
    empresa_id = public.get_my_empresa_id()
    and public.get_my_role() in ('admin','super_admin')
  );

create policy "Ver evidencias de mi empresa" on public.evidencias
  for select using (empresa_id = public.get_my_empresa_id());

create policy "Insertar evidencias de mi empresa" on public.evidencias
  for insert with check (empresa_id = public.get_my_empresa_id());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, apellido)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'apellido', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger objetivos_updated_at
  before update on public.objetivos
  for each row execute procedure public.handle_updated_at();
