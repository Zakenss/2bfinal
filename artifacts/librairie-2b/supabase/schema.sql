-- Librairie 2B — Supabase schema
-- Run in Supabase Dashboard → SQL Editor (new project) or: supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Schools
create table if not exists public.ecoles (
  id uuid primary key default gen_random_uuid(),
  nom_ecole text not null unique,
  created_at timestamptz default now(),
  created_by text
);

-- Portal users (custom auth — passwords stored in plain text in app code)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  space text not null check (space in ('espace_client', 'espace_adjoint')),
  username text not null,
  email text,
  password text not null,
  role text not null default 'user' check (role in ('admin', 'user', 'couverture')),
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists users_space_email_idx on public.users (space, email);
create index if not exists users_space_username_idx on public.users (space, username);

-- Student / book-list orders
create table if not exists public.students (
  id uuid primary key,
  code text unique,
  nom text,
  ecole text,
  niveau text,
  genre text,
  email text,
  telephone text,
  liste_prete boolean default false,
  rangee text,
  niveau_rangement text,
  avance numeric,
  note text,
  couverture_demandee boolean default false,
  couverture_sent boolean default false,
  couverture_sent_at timestamptz,
  couverture_sent_by text,
  modified_by text,
  modified_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists students_code_idx on public.students (code);
create index if not exists students_nom_idx on public.students (nom);
create index if not exists students_ecole_niveau_idx on public.students (ecole, niveau);

-- Row Level Security (permissive — tighten before production)
alter table public.ecoles enable row level security;
alter table public.users enable row level security;
alter table public.students enable row level security;

drop policy if exists "anon_all_ecoles" on public.ecoles;
create policy "anon_all_ecoles" on public.ecoles for all to anon, authenticated using (true) with check (true);

drop policy if exists "anon_all_users" on public.users;
create policy "anon_all_users" on public.users for all to anon, authenticated using (true) with check (true);

drop policy if exists "anon_all_students" on public.students;
create policy "anon_all_students" on public.students for all to anon, authenticated using (true) with check (true);

-- Realtime (Manager dashboard, Correction, Couverture pages)
alter table public.students replica identity full;

-- Optional seed: manager login (change password after first login)
-- insert into public.users (space, username, email, password, role, active)
-- values ('espace_client', 'admin@example.com', 'admin@example.com', 'changeme', 'admin', true);

-- Couverture page access for lib2b@gmail.com (set your password)
-- insert into public.users (space, username, email, password, role, active)
-- values ('espace_client', 'lib2b@gmail.com', 'lib2b@gmail.com', 'YOUR_PASSWORD', 'couverture', true)
-- on conflict do nothing;
