create table if not exists public.profiles (
  user_id uuid primary key,
  height_cm numeric(5, 1) not null,
  birth_date date not null,
  gender text not null,
  activity_level text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_height_cm_check check (height_cm >= 100 and height_cm <= 250),
  constraint profiles_gender_check check (gender in ('male', 'female', 'unspecified')),
  constraint profiles_activity_level_check check (
    activity_level in ('sedentary', 'light', 'active')
  )
);

create table if not exists public.calorie_goals (
  user_id uuid primary key,
  current_weight_kg numeric(5, 2) not null,
  target_weight_kg numeric(5, 2) not null,
  period_unit text not null,
  period_count integer not null,
  period_days integer not null,
  bmr_kcal integer not null,
  tdee_kcal integer not null,
  daily_deficit_kcal integer not null,
  daily_kcal integer not null,
  weekly_kcal integer not null,
  floor_kcal integer not null,
  floor_applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calorie_goals_weight_check check (
    current_weight_kg >= 20
    and current_weight_kg <= 300
    and target_weight_kg >= 20
    and target_weight_kg <= 300
  ),
  constraint calorie_goals_period_unit_check check (period_unit in ('weeks', 'months')),
  constraint calorie_goals_period_count_check check (period_count >= 1 and period_count <= 520),
  constraint calorie_goals_period_days_check check (period_days >= 1 and period_days <= 2000),
  constraint calorie_goals_kcal_check check (
    daily_kcal > 0
    and weekly_kcal > 0
    and floor_kcal > 0
  )
);

alter table public.profiles enable row level security;
alter table public.calorie_goals enable row level security;
