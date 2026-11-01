-- 日記（今日のひとこと）と、その日のAIの返事。1ユーザー1日1件。
-- 読み書きはログインした本人だけ。anon には権限を渡しません。
-- service_role には渡しません。日記はこのテーブルを、ログインセッションだけで読み書きします。
-- 公開シェアカード（share_cards）とは別です。既存の meal_records / weight_records は変更しません。

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  body text not null,
  ai_reply text,
  advisor_id text,
  reply_sensitive boolean not null default false,
  share_reply boolean not null default true,
  reply_generated_at timestamptz,
  reply_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diary_entries_user_date_key unique (user_id, entry_date),
  constraint diary_entries_body_length_check check (char_length(body) between 1 and 500),
  constraint diary_entries_advisor_id_check check (
    advisor_id is null
    or advisor_id in ('sharp', 'kind', 'clerical', 'coach', 'kansai')
  ),
  constraint diary_entries_reply_count_check check (reply_count >= 0),
  constraint diary_entries_sensitive_not_shared_check check (
    reply_sensitive = false or share_reply = false
  )
);

alter table public.diary_entries enable row level security;

grant select, insert, update, delete on table public.diary_entries to authenticated;
revoke all on table public.diary_entries from anon;

drop policy if exists diary_entries_select_own on public.diary_entries;
create policy diary_entries_select_own
  on public.diary_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists diary_entries_insert_own on public.diary_entries;
create policy diary_entries_insert_own
  on public.diary_entries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists diary_entries_update_own on public.diary_entries;
create policy diary_entries_update_own
  on public.diary_entries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists diary_entries_delete_own on public.diary_entries;
create policy diary_entries_delete_own
  on public.diary_entries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
