-- 体重グラフの縦軸。ログインした本人だけが読み書きできます。
-- 上限・下限は、両方空（自動）か、両方入力で差が2kg以上です。

create table if not exists public.weight_axis_preferences (
  user_id uuid primary key,
  min_kg numeric(5, 1),
  max_kg numeric(5, 1),
  updated_at timestamptz not null default now(),
  constraint weight_axis_preferences_range_check check (
    (
      min_kg is null
      and max_kg is null
    )
    or (
      min_kg is not null
      and max_kg is not null
      and min_kg >= 20
      and min_kg <= 300
      and max_kg >= 20
      and max_kg <= 300
      and max_kg >= min_kg + 2
    )
  )
);

alter table public.weight_axis_preferences enable row level security;

grant select, insert, update, delete on table public.weight_axis_preferences to authenticated;
revoke all on table public.weight_axis_preferences from anon;

drop policy if exists own_rows on public.weight_axis_preferences;
create policy own_rows
  on public.weight_axis_preferences
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
