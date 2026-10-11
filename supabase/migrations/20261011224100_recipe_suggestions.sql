-- 自炊メニュー提案。ログインした本人だけが読み書きできます。
-- anon には権限を渡しません。

create table if not exists public.recipe_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  main_ingredients json not null,
  suggestions json not null,
  closing text not null
);

create index if not exists recipe_suggestions_user_created_idx
  on public.recipe_suggestions (user_id, created_at desc);

alter table public.recipe_suggestions enable row level security;

grant select, insert, update, delete on table public.recipe_suggestions to authenticated;
revoke all on table public.recipe_suggestions from anon;

drop policy if exists own_rows on public.recipe_suggestions;
create policy own_rows
  on public.recipe_suggestions
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
