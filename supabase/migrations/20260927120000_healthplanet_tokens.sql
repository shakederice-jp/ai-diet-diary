create table if not exists public.healthplanet_tokens (
  user_id uuid primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text not null default 'innerscan,sphygmomanometer,pedometer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.healthplanet_tokens enable row level security;
