"use client";

import { useMemo, useState } from "react";
import {
  EATING_OUT_DISCLAIMER,
  EATING_OUT_DISHES,
  EATING_OUT_EMPTY,
  EATING_OUT_GENRE_NOTE,
  EATING_OUT_GENRES,
  EATING_OUT_TITLE,
  calorieMark,
  filterEatingOutDishes,
  formatEatingOutRange,
  isBalancedDish,
  proteinMark,
  vegetableMark,
  type EatingOutDish,
  type EatingOutGenre,
  type EatingOutMark,
  type EatingOutSort,
} from "@/lib/eating-out-guide";
import { Breadcrumbs, guideBreadcrumbItems } from "@/components/Breadcrumbs";
import { GuideSentence, OtherGuides } from "@/components/guide-links";
import { StaplesGuide } from "@/components/staples-guide";
import { SiteFooter } from "@/components/site-footer";
import { TryAppCta } from "@/components/try-app-cta";
import { APP_DISCLAIMER } from "@/lib/site";

const CRITERIA = [
  ["カロリー", "◎650kcal以下 / ○651〜850 / △851以上"],
  ["たんぱく質", "◎30g以上 / ○20〜29g / △20g未満"],
  ["野菜", "◎120g以上 / ○70〜119g / △70g未満(いも・豆・きのこ・海藻・薬味は除く)"],
] as const;

const ROW_GRID =
  "grid w-full grid-cols-[minmax(0,1fr)_4.5rem_3.25rem_4rem_2.5rem] items-center gap-x-1 px-1 md:grid-cols-[minmax(0,1.15fr)_5rem_4.5rem_5.5rem_4rem_minmax(0,1.4fr)] md:gap-x-2 md:px-2";

const SORT_MARK: Record<Exclude<EatingOutSort, "standard">, string> = {
  calorie: "▲",
  protein: "▼",
  vegetable: "▼",
};

function markClass(mark: EatingOutMark) {
  if (mark === "◎") {
    return "bg-[#F5821F] text-white";
  }
  if (mark === "○") {
    return "border border-[#F5821F] text-[#F5821F]";
  }
  return "border border-[#C8C2B8] text-[#6F6A62]";
}

function MarkBadge({ mark }: { mark: EatingOutMark }) {
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-sm text-xs font-semibold leading-none ${markClass(mark)}`}
    >
      {mark}
    </span>
  );
}

function genreBandLabel(genre: EatingOutGenre, count: number) {
  const note = EATING_OUT_GENRE_NOTE[genre];
  return note ? `${genre}(${note}・${count})` : `${genre}(${count})`;
}

export function EatingOutGuide({ startHref }: { startHref: "/" | "/signup" }) {
  const [sort, setSort] = useState<EatingOutSort>("standard");
  const [genre, setGenre] = useState<EatingOutGenre | "すべて">("すべて");
  const [balancedOnly, setBalancedOnly] = useState(false);
  const [openNames, setOpenNames] = useState<ReadonlySet<string>>(() => new Set());

  const dishes = useMemo(
    () => filterEatingOutDishes(EATING_OUT_DISHES, { genre, balancedOnly, sort }),
    [genre, balancedOnly, sort],
  );
  const sections = useMemo(() => {
    if (sort !== "standard") {
      return [{ genre: null as EatingOutGenre | null, dishes }];
    }
    return EATING_OUT_GENRES.map((item) => ({
      genre: item,
      dishes: dishes.filter((dish) => dish.genre === item),
    })).filter((section) => section.dishes.length > 0);
  }, [dishes, sort]);

  function toggleSort(next: Exclude<EatingOutSort, "standard">) {
    setSort((current) => (current === next ? "standard" : next));
  }

  function toggleDish(name: string) {
    setOpenNames((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-3 py-3 font-sans sm:px-4">
      <main className="w-full max-w-6xl">
        <header id="eating-out-intro">
          <Breadcrumbs items={guideBreadcrumbItems("/eating-out")} />
          <h1 className="mt-1 text-lg font-semibold leading-6 tracking-tight text-zinc-950">
            {EATING_OUT_TITLE}
          </h1>
          <p className="mt-1 text-xs leading-5 text-zinc-700">
            外食メニュー74品のカロリー・たんぱく質・野菜の目安です。印は目安の真ん中の数字で判定しています。推定を含みます。
          </p>
          <table className="mt-2 w-full text-[11px] leading-4 text-[#6B4A32]">
            <tbody>
              {CRITERIA.map(([label, text]) => (
                <tr key={label}>
                  <th scope="row" className="whitespace-nowrap pr-2 text-left align-top font-medium">
                    {label}
                  </th>
                  <td className="align-top">{text}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] leading-4 text-[#6B4A32]">
            ★: カロリーが△でなく、たんぱく質と野菜もともに△でないメニュー
          </p>
        </header>

        <StaplesGuide />

        <div className="mt-2 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip selected={genre === "すべて"} onClick={() => setGenre("すべて")}>
              すべて
            </FilterChip>
            {EATING_OUT_GENRES.map((item) => (
              <FilterChip key={item} selected={genre === item} onClick={() => setGenre(item)}>
                {item}
              </FilterChip>
            ))}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={balancedOnly}
            className={`inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-xs ${
              balancedOnly
                ? "bg-[#F5821F] font-semibold text-white"
                : "border border-[#E4D7C6] bg-[#FBF6EE] font-medium text-[#6B4A32]"
            }`}
            onClick={() => setBalancedOnly((current) => !current)}
          >
            ★ バランス良しだけ
          </button>
        </div>

        <div
          id="eating-out-columns"
          className={`sticky top-0 z-20 mt-2 border-b border-[#C4B39A] bg-[#E6D9C8] py-1 ${ROW_GRID}`}
        >
          <div className="text-[11px] font-medium text-[#6B4A32]">メニュー</div>
          <div className="text-center text-[11px] font-medium text-[#6B4A32]">kcal</div>
          <SortHeader label="カロリー" active={sort === "calorie"} mark={SORT_MARK.calorie} onClick={() => toggleSort("calorie")} />
          <SortHeader label="たんぱく質" active={sort === "protein"} mark={SORT_MARK.protein} onClick={() => toggleSort("protein")} />
          <SortHeader label="野菜" active={sort === "vegetable"} mark={SORT_MARK.vegetable} onClick={() => toggleSort("vegetable")} />
          <div className="hidden text-[11px] font-medium text-[#6B4A32] md:block">ひとこと</div>
        </div>

        {dishes.length === 0 ? (
          <p className="py-4 text-sm text-zinc-700" role="status">
            {EATING_OUT_EMPTY}
          </p>
        ) : (
          <div>
            {sections.map((section) => (
              <section key={section.genre ?? "sorted"}>
                {section.genre ? (
                  <h2 className="flex h-7 items-center bg-[#F3EBDD] px-2 text-xs font-medium text-[#6B4A32]">
                    {genreBandLabel(section.genre, section.dishes.length)}
                  </h2>
                ) : null}
                {section.dishes.map((dish) => (
                  <DishRow
                    key={dish.name}
                    dish={dish}
                    open={openNames.has(dish.name)}
                    onToggle={() => toggleDish(dish.name)}
                  />
                ))}
              </section>
            ))}
          </div>
        )}

        <footer className="mt-4 space-y-2 text-[11px] leading-5 text-[#6B4A32]">
          <p>{EATING_OUT_DISCLAIMER}</p>
          <p>野菜の量は、ほとんどが推定です。</p>
          <p>{APP_DISCLAIMER}</p>
          <GuideSentence href="/sweets" className="pt-2" />
          <OtherGuides currentHref="/eating-out" className="pt-2" />
          <TryAppCta href={startHref} className="pt-2" />
          <SiteFooter className="pt-4" />
        </footer>
      </main>
    </div>
  );
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-11 shrink-0 items-center rounded-full px-3 text-xs ${
        selected
          ? "bg-[#F5821F] font-semibold text-white"
          : "border border-[#E4D7C6] bg-[#FBF6EE] font-medium text-[#6B4A32]"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SortHeader({
  label,
  active,
  mark,
  onClick,
}: {
  label: string;
  active: boolean;
  mark: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`min-h-11 whitespace-nowrap text-center text-[10px] leading-tight font-medium md:text-xs ${
        active ? "font-semibold text-[#F5821F]" : "text-[#6B4A32]"
      }`}
      onClick={onClick}
    >
      {label}
      {active ? mark : ""}
    </button>
  );
}

function DishRow({
  dish,
  open,
  onToggle,
}: {
  dish: EatingOutDish;
  open: boolean;
  onToggle: () => void;
}) {
  const balanced = isBalancedDish(dish);
  const detailId = `eating-out-detail-${dish.name}`;
  return (
    <div className={`border-b border-[#E7DCC8] ${open ? "bg-[#FBF6EE]" : ""}`}>
      <button
        type="button"
        data-menu-row=""
        aria-expanded={open}
        aria-controls={detailId}
        className={`${ROW_GRID} min-h-11 py-1 text-left`}
        onClick={onToggle}
      >
        <span className="line-clamp-2 text-sm leading-[18px] text-zinc-950">
          {balanced ? <span className="mr-0.5 text-[12px] text-[#F5821F]">★</span> : null}
          {dish.name}
        </span>
        <span className="text-center text-xs tabular-nums text-zinc-800">
          {dish.calorie[0]}〜{dish.calorie[1]}
        </span>
        <span className="flex justify-center">
          <MarkBadge mark={calorieMark(dish.calorie)} />
        </span>
        <span className="flex justify-center">
          <MarkBadge mark={proteinMark(dish.protein)} />
        </span>
        <span className="flex justify-center">
          <MarkBadge mark={vegetableMark(dish.vegetable)} />
        </span>
        <span className="hidden truncate text-xs leading-4 text-zinc-700 md:block">{dish.comment}</span>
      </button>
      {open ? (
        <div id={detailId} className="space-y-1 px-2 pb-2 text-xs leading-5 text-zinc-800">
          <p>たんぱく質 {formatEatingOutRange(dish.protein, "g", dish.proteinOfficial)}</p>
          <p>野菜 {formatEatingOutRange(dish.vegetable, "g", dish.vegetableOfficial)}</p>
          {dish.note ? <p className="text-[#6B4A32]">{dish.note}</p> : null}
          <p>{dish.comment}</p>
          {balanced ? (
            <p>★ バランス良し。カロリーが△でなく、たんぱく質と野菜もともに△でないメニューです。</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
