create table if not exists public.advisor_preferences (
  user_id uuid primary key,
  advisor_id text not null,
  updated_at timestamptz not null default now(),
  constraint advisor_preferences_advisor_id_check check (
    advisor_id in ('sharp', 'kind', 'clerical', 'coach', 'kansai')
  )
);

create table if not exists public.advisor_comments (
  user_id uuid not null,
  recorded_on date not null,
  advisor_id text not null,
  record_hash text not null,
  comment text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, recorded_on),
  constraint advisor_comments_advisor_id_check check (
    advisor_id in ('sharp', 'kind', 'clerical', 'coach', 'kansai')
  )
);

alter table public.advisor_preferences enable row level security;
alter table public.advisor_comments enable row level security;
