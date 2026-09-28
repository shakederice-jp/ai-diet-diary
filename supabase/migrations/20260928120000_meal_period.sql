alter table public.meal_records
  add column if not exists meal_period text;

alter table public.meal_records
  add column if not exists meal_source text;

update public.meal_records
set meal_period = case
  when extract(hour from (created_at at time zone 'Asia/Tokyo')) < 11 then '朝食'
  when extract(hour from (created_at at time zone 'Asia/Tokyo')) < 14 then '昼食'
  when extract(hour from (created_at at time zone 'Asia/Tokyo')) >= 18 then '夕食'
  else '間食'
end
where meal_period is null
   or meal_period not in ('朝食', '昼食', '夕食', '間食');

update public.meal_records
set meal_source = case
  when meal_period = '間食' then null
  else '内食'
end
where meal_source is null
   or meal_period = '間食'
   or meal_source not in ('外食', '内食', '中食');

alter table public.meal_records
  alter column meal_period set not null;

alter table public.meal_records
  drop constraint if exists meal_records_meal_period_check;

alter table public.meal_records
  add constraint meal_records_meal_period_check
  check (meal_period in ('朝食', '昼食', '夕食', '間食'));

alter table public.meal_records
  drop constraint if exists meal_records_meal_source_check;

alter table public.meal_records
  add constraint meal_records_meal_source_check
  check (
    (meal_period = '間食' and meal_source is null)
    or (meal_period <> '間食' and meal_source in ('外食', '内食', '中食'))
  );
