-- 公開カードに、選んだ状況・連続日数・体重変化の表示だけを足す。
-- ユーザーID、体重の絶対値、カロリー、食事名、日付は入れない。
-- キャラと状況の返事は share_reply_cache に置き、公開カードからも本人からも切り離す。
alter table public.share_cards
  add column if not exists situation text,
  add column if not exists streak_days integer,
  add column if not exists weight_label text,
  add column if not exists show_streak boolean not null default true,
  add column if not exists show_weight boolean not null default false;

alter table public.share_cards drop constraint if exists share_cards_situation_check;
alter table public.share_cards
  add constraint share_cards_situation_check check (
    situation is null or situation in (
      '夜にがっつり食べてしまった',
      '間食を我慢できた',
      '外食だったけど頑張った',
      '少し休んだけど戻ってきた',
      '体重は変わらないけど記録は続けている',
      '今日もちゃんと記録できた'
    )
  );

alter table public.share_cards drop constraint if exists share_cards_streak_days_check;
alter table public.share_cards
  add constraint share_cards_streak_days_check check (
    streak_days is null or streak_days >= 2
  );

alter table public.share_cards drop constraint if exists share_cards_weight_label_check;
alter table public.share_cards
  add constraint share_cards_weight_label_check check (
    weight_label is null or weight_label ~ '^スタートから (−[0-9]{1,3}\.[0-9]kg|±0kg)$'
  );

create table if not exists public.share_reply_cache (
  character_id text not null,
  situation text not null,
  text text not null,
  created_at timestamptz not null default now(),
  primary key (character_id, situation),
  constraint share_reply_cache_character_id_check check (
    character_id in ('sharp', 'kind', 'clerical', 'coach', 'kansai')
  ),
  constraint share_reply_cache_situation_check check (
    situation in (
      '夜にがっつり食べてしまった',
      '間食を我慢できた',
      '外食だったけど頑張った',
      '少し休んだけど戻ってきた',
      '体重は変わらないけど記録は続けている',
      '今日もちゃんと記録できた'
    )
  ),
  constraint share_reply_cache_text_length_check check (char_length(text) between 1 and 40)
);

alter table public.share_reply_cache enable row level security;
revoke all on table public.share_reply_cache from anon, authenticated;
