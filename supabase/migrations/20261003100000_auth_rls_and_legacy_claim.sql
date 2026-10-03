create table if not exists public.legacy_data_claims (
  id integer primary key default 1,
  auth_user_id uuid not null,
  claimed_at timestamptz not null default now(),
  constraint legacy_data_claims_singleton check (id = 1)
);

alter table public.legacy_data_claims enable row level security;

create or replace function public.claim_legacy_diary()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid := auth.uid();
  legacy uuid[];
  primary_id uuid;
  profile_id uuid;
  goal_id uuid;
  advisor_owner uuid;
begin
  if new_id is null then
    raise exception 'login required';
  end if;

  perform pg_advisory_xact_lock(405930);
  if exists (select 1 from public.legacy_data_claims) then
    return;
  end if;

  select coalesce(array_agg(distinct user_id), '{}')
  into legacy
  from (
    select user_id from public.healthplanet_tokens
    union
    select profile.user_id
    from public.profiles profile
    where exists (
      select 1
      from public.profiles owner
      join public.healthplanet_tokens token on token.user_id = owner.user_id
      where owner.height_cm = profile.height_cm
        and owner.birth_date = profile.birth_date
        and owner.gender = profile.gender
    )
  ) owners;

  if coalesce(array_length(legacy, 1), 0) = 0 then
    insert into public.legacy_data_claims (auth_user_id) values (new_id);
    return;
  end if;

  select user_id into primary_id
  from public.healthplanet_tokens
  where user_id = any(legacy)
  order by updated_at desc
  limit 1;

  select user_id into profile_id
  from public.profiles
  where user_id = any(legacy)
  order by case when user_id = primary_id then 0 else 1 end, updated_at desc
  limit 1;

  select user_id into goal_id
  from public.calorie_goals
  where user_id = any(legacy)
  order by updated_at desc
  limit 1;

  select user_id into advisor_owner
  from public.advisor_preferences
  where user_id = any(legacy)
  order by updated_at desc
  limit 1;

  update public.meal_records set user_id = new_id where user_id = any(legacy);
  update public.weight_records set user_id = new_id where user_id = any(legacy);

  delete from public.step_records older
  using public.step_records newer
  where older.user_id = any(legacy)
    and newer.user_id = any(legacy)
    and older.recorded_on = newer.recorded_on
    and older.id <> newer.id
    and (
      older.updated_at < newer.updated_at
      or (older.updated_at = newer.updated_at and older.user_id <> primary_id)
    );
  update public.step_records set user_id = new_id where user_id = any(legacy);

  delete from public.advisor_comments older
  using public.advisor_comments newer
  where older.user_id = any(legacy)
    and newer.user_id = any(legacy)
    and older.recorded_on = newer.recorded_on
    and older.user_id <> newer.user_id
    and (
      older.updated_at < newer.updated_at
      or (older.updated_at = newer.updated_at and newer.user_id = primary_id)
    );
  update public.advisor_comments set user_id = new_id where user_id = any(legacy);

  delete from public.advisor_affection_days older
  using public.advisor_affection_days newer
  where older.user_id = any(legacy)
    and newer.user_id = any(legacy)
    and older.advisor_id = newer.advisor_id
    and older.recorded_on = newer.recorded_on
    and older.user_id <> newer.user_id
    and older.ctid < newer.ctid;
  update public.advisor_affection_days set user_id = new_id where user_id = any(legacy);

  delete from public.streak_freezes older
  using public.streak_freezes newer
  where older.user_id = any(legacy)
    and newer.user_id = any(legacy)
    and older.frozen_on = newer.frozen_on
    and older.user_id <> newer.user_id
    and older.ctid < newer.ctid;
  update public.streak_freezes set user_id = new_id where user_id = any(legacy);

  delete from public.streak_freeze_declines older
  using public.streak_freeze_declines newer
  where older.user_id = any(legacy)
    and newer.user_id = any(legacy)
    and older.missed_on = newer.missed_on
    and older.user_id <> newer.user_id
    and older.ctid < newer.ctid;
  update public.streak_freeze_declines set user_id = new_id where user_id = any(legacy);

  delete from public.favorite_menus
  where user_id = any(legacy)
    and user_id is distinct from primary_id;
  update public.favorite_menus set user_id = new_id where user_id = primary_id;

  delete from public.menu_categories
  where user_id = any(legacy)
    and user_id is distinct from primary_id;
  update public.menu_categories set user_id = new_id where user_id = primary_id;

  delete from public.profiles
  where user_id = any(legacy)
    and user_id is distinct from profile_id;
  update public.profiles set user_id = new_id where user_id = profile_id;

  delete from public.calorie_goals
  where user_id = any(legacy)
    and user_id is distinct from goal_id;
  update public.calorie_goals set user_id = new_id where user_id = goal_id;

  delete from public.advisor_preferences
  where user_id = any(legacy)
    and user_id is distinct from advisor_owner;
  update public.advisor_preferences set user_id = new_id where user_id = advisor_owner;

  delete from public.healthplanet_tokens
  where user_id = any(legacy)
    and user_id is distinct from primary_id;
  update public.healthplanet_tokens set user_id = new_id where user_id = primary_id;

  delete from public.user_streaks where user_id = any(legacy);
  delete from public.ranking_preferences where user_id = any(legacy);

  insert into public.legacy_data_claims (auth_user_id) values (new_id);
end;
$$;

revoke all on function public.claim_legacy_diary() from public, anon;
grant execute on function public.claim_legacy_diary() to authenticated;

create or replace function public.streak_rank(my_streak integer)
returns table (higher_count integer, total_count integer)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (where streak_days > my_streak)::integer,
    count(*)::integer
  from public.user_streaks;
$$;

revoke all on function public.streak_rank(integer) from public, anon;
grant execute on function public.streak_rank(integer) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'healthplanet_tokens',
    'weight_records',
    'meal_records',
    'menu_categories',
    'favorite_menus',
    'profiles',
    'calorie_goals',
    'advisor_preferences',
    'advisor_comments',
    'advisor_affection_days',
    'streak_freezes',
    'streak_freeze_declines',
    'step_records',
    'user_streaks',
    'ranking_preferences'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('drop policy if exists own_rows on public.%I', table_name);
    execute format(
      'create policy own_rows on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      table_name
    );
  end loop;
end $$;
