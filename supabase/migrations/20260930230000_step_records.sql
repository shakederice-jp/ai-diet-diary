create table if not exists public.step_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  recorded_on date not null,
  steps integer not null,
  distance_km numeric(4, 1),
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recorded_on),
  constraint step_records_steps_check check (steps >= 0 and steps <= 200000),
  constraint step_records_distance_check check (
    distance_km is null or (distance_km >= 0 and distance_km <= 200)
  )
);

alter table public.step_records enable row level security;
