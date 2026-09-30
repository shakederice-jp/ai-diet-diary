create table if not exists public.streak_freezes (
  user_id uuid not null,
  frozen_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, frozen_on)
);

create table if not exists public.streak_freeze_declines (
  user_id uuid not null,
  missed_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, missed_on)
);

create table if not exists public.advisor_affection_days (
  user_id uuid not null,
  advisor_id text not null,
  recorded_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, advisor_id, recorded_on),
  constraint advisor_affection_days_advisor_id_check check (
    advisor_id in ('sharp', 'kind', 'clerical', 'coach', 'kansai')
  )
);

alter table public.streak_freezes enable row level security;
alter table public.streak_freeze_declines enable row level security;
alter table public.advisor_affection_days enable row level security;
