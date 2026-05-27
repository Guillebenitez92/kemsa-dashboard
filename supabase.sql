-- Ejecutá esto UNA sola vez en Supabase:
-- Proyecto Supabase  ->  SQL Editor  ->  New query  ->  pegar  ->  Run.

create extension if not exists "pgcrypto";

create table if not exists public.survey_responses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text,
  gender          text not null,
  age_range       text not null,
  train_frequency text not null,
  buys_where      text,
  comment         text,
  selections      jsonb not null default '[]'::jsonb
);

-- Seguridad: activamos RLS y NO creamos ninguna política pública.
-- Así, aunque el enlace se reenvíe, nadie puede leer ni escribir
-- directamente esta tabla. La app entra solo desde el servidor con la
-- service role key (que nunca llega al navegador).
alter table public.survey_responses enable row level security;

create index if not exists survey_responses_created_at_idx
  on public.survey_responses (created_at desc);

-- ── Catálogo mayorista: pedidos de locales/tiendas ──────────────────
create table if not exists public.pedidos (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  empresa         text not null,
  contacto        text not null,
  phone           text,
  comment         text,
  total_curvas    int not null default 0,
  total_unidades  int not null default 0,
  total_usd       numeric not null default 0,
  items           jsonb not null default '[]'::jsonb
);

alter table public.pedidos enable row level security;

create index if not exists pedidos_created_at_idx
  on public.pedidos (created_at desc);

-- ── Promociones: agenda compartida de campañas con bancos y shoppings ──
-- Las tiendas leen la lista pública (sin login) por la API del servidor;
-- solo admin (con cookie) puede crear/editar/eliminar.
create table if not exists public.promociones (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  titulo          text not null,
  descripcion     text,
  bancos          text[] not null default '{}',
  shoppings       text[] not null default '{}',
  tiendas         text[] not null default '{}',
  marcas          text[] not null default '{}',
  fecha_inicio    date not null,
  fecha_fin       date not null,
  descuento_pct   numeric,
  cuotas          int,
  tope            numeric,
  moneda          text default 'PYG',
  notas           text,
  activa          boolean not null default true,
  color           text,
  created_by      text
);

alter table public.promociones enable row level security;

create index if not exists promociones_fecha_idx
  on public.promociones (fecha_inicio, fecha_fin);

create index if not exists promociones_activa_idx
  on public.promociones (activa, fecha_fin desc);
