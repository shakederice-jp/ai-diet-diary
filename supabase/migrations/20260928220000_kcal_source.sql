-- Calorie origin. meal_source stays 外食 / 内食 / 中食.
alter table public.meal_records
  add column if not exists kcal_source text;

update public.meal_records
set kcal_source = 'ai'
where kcal_source is null
   or kcal_source not in ('manual', 'ai');

alter table public.meal_records
  alter column kcal_source set default 'ai';

alter table public.meal_records
  alter column kcal_source set not null;

alter table public.meal_records
  drop constraint if exists meal_records_kcal_source_check;

alter table public.meal_records
  add constraint meal_records_kcal_source_check
  check (kcal_source in ('manual', 'ai'));
