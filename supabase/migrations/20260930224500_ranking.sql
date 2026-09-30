create table if not exists public.user_streaks (
  user_id uuid primary key,
  streak_days integer not null check (streak_days >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.ranking_preferences (
  user_id uuid primary key,
  compare_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;
alter table public.ranking_preferences enable row level security;
