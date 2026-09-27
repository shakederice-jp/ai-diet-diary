create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.favorite_menus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null,
  kcal integer not null check (kcal >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.meal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  recorded_on date not null,
  name text not null,
  kcal integer not null check (kcal >= 0),
  favorite_id uuid references public.favorite_menus (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists meal_records_user_date_idx
  on public.meal_records (user_id, recorded_on);

alter table public.menu_categories enable row level security;
alter table public.favorite_menus enable row level security;
alter table public.meal_records enable row level security;
