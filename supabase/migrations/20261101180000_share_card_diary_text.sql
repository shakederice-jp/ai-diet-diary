-- シェアカードの「わたし」の文を、日記から切り出した80文字までにする。
-- AIの返事を載せるときは、日記の返事（150文字まで）を text に入れる。
-- これまでの6つの定型文と、40文字以内の返事も、この条件を満たす。

alter table public.share_cards drop constraint if exists share_cards_situation_check;
alter table public.share_cards
  add constraint share_cards_situation_check check (
    situation is null or char_length(situation) between 1 and 80
  );

alter table public.share_cards drop constraint if exists share_cards_text_length_check;
alter table public.share_cards
  add constraint share_cards_text_length_check check (
    char_length(text) between 1 and 150
  );
