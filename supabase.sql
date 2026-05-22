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
