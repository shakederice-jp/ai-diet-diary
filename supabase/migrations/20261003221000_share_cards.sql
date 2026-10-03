-- 公開カードにはユーザーIDを置かない。
-- share_card_owners は本人の削除と、同じコメントの再利用だけに使う。
-- share_card_creations は1日10回の回数だけを数え、カードを消しても戻さない。
-- どちらも公開ページには出さない。書き込みはサーバーの service role だけ。
create table if not exists public.share_cards (
  id text primary key,
  character_id text not null,
  text text not null,
  created_at timestamptz not null default now(),
  constraint share_cards_character_id_check check (
    character_id in ('sharp', 'kind', 'clerical', 'coach', 'kansai')
  ),
  constraint share_cards_text_length_check check (char_length(text) between 1 and 40)
);

create table if not exists public.share_card_owners (
  card_id text primary key references public.share_cards (id) on delete cascade,
  user_id uuid not null,
  source_hash text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_hash)
);

create index if not exists share_card_owners_user_created_idx
  on public.share_card_owners (user_id, created_at desc);

create table if not exists public.share_card_creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists share_card_creations_user_created_idx
  on public.share_card_creations (user_id, created_at desc);

alter table public.share_cards enable row level security;
alter table public.share_card_owners enable row level security;
alter table public.share_card_creations enable row level security;

revoke all on table public.share_cards from anon, authenticated;
revoke all on table public.share_card_creations from anon, authenticated;
revoke all on table public.share_card_owners from anon, authenticated;
grant select, delete on public.share_card_owners to authenticated;

drop policy if exists share_card_owners_select_own on public.share_card_owners;
create policy share_card_owners_select_own
  on public.share_card_owners
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists share_card_owners_delete_own on public.share_card_owners;
create policy share_card_owners_delete_own
  on public.share_card_owners
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
