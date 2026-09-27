alter table public.healthplanet_tokens
  add column if not exists weight_synced_at timestamptz;

create table if not exists public.weight_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  measured_at timestamptz not null,
  weight_kg numeric(6, 2) not null,
  model text,
  source text not null default 'healthplanet',
  created_at timestamptz not null default now(),
  unique (user_id, measured_at)
);

alter table public.weight_records enable row level security;
