"use client";

import { useMemo, useState } from "react";
import { InstantLink } from "@/components/instant-link";
import {
  EATING_OUT_BALANCED_LABEL,
  EATING_OUT_DISCLAIMER,
  EATING_OUT_DISHES,
  EATING_OUT_EMPTY,
  EATING_OUT_GENRES,
  EATING_OUT_LEAD,
  EATING_OUT_MARK_LEAD,
  EATING_OUT_MARK_SCALE,
  EATING_OUT_SORTS,
  EATING_OUT_TITLE,
  EATING_OUT_UPDATED,
  EATING_OUT_VEGETABLE_NOTE,
  calorieMark,
  eatingOutGenreLabel,
  filterEatingOutDishes,
  formatEatingOutRange,
  isBalancedDish,
  proteinMark,
  vegetableMark,
  type EatingOutGenre,
  type EatingOutMark,
  type EatingOutSort,
} from "@/lib/eating-out-guide";

function chipClass(selected: boolean) {
  const base =
    "inline-flex min-h-[44px] items-center justify-center rounded-full px-3 text-sm";
  if (selected) {
    return `${base} bg-[#F5821F] font-semibold text-white`;
  }
  return `${base} border border-[#E4D7C6] bg-[#FBF6EE] font-medium text-[#6B4A32] hover:bg-[#E7DCC8]`;
}

function MarkBadge({ mark }: { mark: EatingOutMark }) {
  const tone =
    mark === "◎"
      ? "bg-[#F5821F] text-white"
      : mark === "○"
        ? "border border-[#F5821F] text-[#F5821F]"
        : "border border-[#C8C2B8] text-[#6F6A62]";
  return (
    <span
      className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1 text-sm font-semibold leading-none ${tone}`}
    >
      {mark}
    </span>
  );
}

export function EatingOutGuide() {
  const [sort, setSort] = useState<EatingOutSort>("standard");
  const [genre, setGenre] = useState<EatingOutGenre | "すべて">("すべて");
  const [balancedOnly, setBalancedOnly] = useState(false);
  const dishes = useMemo(
    () => filterEatingOutDishes(EATING_OUT_DISHES, { genre, balancedOnly, sort }),
    [genre, balancedOnly, sort],
  );

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-6xl">
        <InstantLink
          href="/"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4"
        >
          トップへ
        </InstantLink>
        <p className="mt-4 text-xs text-[#8A7360]">最終更新: {EATING_OUT_UPDATED}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{EATING_OUT_TITLE}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">{EATING_OUT_LEAD}</p>
        <section className="mt-6 max-w-3xl rounded-2xl bg-[#F3EBDD] px-4 py-3 text-sm leading-6 text-[#6B4A32]">
          <p>{EATING_OUT_MARK_LEAD}</p>
          <ul className="mt-2 space-y-1 text-xs leading-5">
            {EATING_OUT_MARK_SCALE.map((row) => (
              <li key={row.label}>
                <span className="font-medium">{row.label}: </span>
                {row.text}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-5">{EATING_OUT_VEGETABLE_NOTE}</p>
        </section>

        <fieldset className="mt-6">
          <legend className="text-xs font-medium text-[#8A7360]">並べ替え</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EATING_OUT_SORTS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={sort === item.id}
                className={chipClass(sort === item.id)}
                onClick={() => setSort(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-[#8A7360]">ジャンル</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={genre === "すべて"}
              className={chipClass(genre === "すべて")}
              onClick={() => setGenre("すべて")}
            >
              すべて
            </button>
            {EATING_OUT_GENRES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={genre === item}
                className={chipClass(genre === item)}
                onClick={() => setGenre(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          aria-pressed={balancedOnly}
          className={`mt-4 ${chipClass(balancedOnly)}`}
          onClick={() => setBalancedOnly((current) => !current)}
        >
          バランス良しだけ表示
        </button>

        {dishes.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-700" role="status">
            {EATING_OUT_EMPTY}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dishes.map((dish) => (
              <li key={dish.name}>
                <article className="h-full rounded-2xl bg-[#FBF6EE] p-4 shadow-sm">
                  <p className="text-xs text-[#8A7360]">{eatingOutGenreLabel(dish.genre)}</p>
                  <h2 className="mt-1 text-base font-semibold leading-6 text-zinc-950">{dish.name}</h2>
                  <dl className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <dt className="w-16 shrink-0 text-xs text-[#8A7360]">カロリー</dt>
                      <dd className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm text-zinc-900">
                        <span className="tabular-nums">{formatEatingOutRange(dish.calorie, "kcal")}</span>
                        <MarkBadge mark={calorieMark(dish.calorie)} />
                      </dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="w-16 shrink-0 text-xs text-[#8A7360]">たんぱく質</dt>
                      <dd className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm text-zinc-900">
                        <span className="tabular-nums">
                          {formatEatingOutRange(dish.protein, "g", dish.proteinOfficial)}
                        </span>
                        <MarkBadge mark={proteinMark(dish.protein)} />
                      </dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="w-16 shrink-0 text-xs text-[#8A7360]">野菜</dt>
                      <dd className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm text-zinc-900">
                        <span className="tabular-nums">
                          {formatEatingOutRange(dish.vegetable, "g", dish.vegetableOfficial)}
                        </span>
                        <MarkBadge mark={vegetableMark(dish.vegetable)} />
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm leading-6 text-zinc-800">{dish.comment}</p>
                  {dish.note ? <p className="mt-2 text-xs leading-5 text-[#8A7360]">{dish.note}</p> : null}
                  {isBalancedDish(dish) ? (
                    <p className="mt-3 inline-flex items-center rounded-full bg-[#F3EBDD] px-2 py-1 text-xs font-medium text-[#6B4A32]">
                      {EATING_OUT_BALANCED_LABEL}
                    </p>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 max-w-3xl text-xs leading-5 text-[#6B4A32]">{EATING_OUT_DISCLAIMER}</p>
      </main>
    </div>
  );
}
