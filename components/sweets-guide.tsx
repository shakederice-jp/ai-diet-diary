"use client";

import { useMemo, useState } from "react";
import { Breadcrumbs, guideBreadcrumbItems } from "@/components/Breadcrumbs";
import { GuideAbout } from "@/components/guide-about";
import { GuideSentence, OtherGuides } from "@/components/guide-links";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { TryAppCta } from "@/components/try-app-cta";
import {
  SWEETS_DISCLAIMER,
  SWEETS_EMPTY,
  SWEETS_GENRES,
  SWEETS_ITEMS,
  SWEETS_LEAD,
  SWEETS_MARK_SCALE,
  SWEETS_NOTICE,
  SWEETS_PACKAGE_NOTE,
  SWEETS_SNACK_NOTE,
  SWEETS_TITLE,
  sweetsSummary,
  filterSweetsItems,
  sweetsBasisLabel,
  sweetsMark,
  type SweetsGenre,
  type SweetsItem,
  type SweetsMark,
  type SweetsMarkFilter,
  type SweetsSort,
} from "@/lib/sweets-guide";
import { GUIDE_UPDATED_ON } from "@/lib/guide-meta";
import { guideStructuredData } from "@/lib/structured-data";

const ROW_GRID =
  "grid w-full grid-cols-[minmax(0,1fr)_4.75rem_4.25rem_1.5rem] items-center gap-x-1 px-1 md:grid-cols-[minmax(0,1.1fr)_5.5rem_4.5rem_2rem_minmax(0,1.4fr)] md:gap-x-2 md:px-2";

const MARK_FILTERS: readonly SweetsMarkFilter[] = ["すべて", "◎だけ", "◎と○"];

function markClass(mark: SweetsMark) {
  if (mark === "◎") {
    return "bg-[#F5821F] text-white";
  }
  if (mark === "○") {
    return "border border-[#F5821F] text-[#F5821F]";
  }
  return "border border-[#C8C2B8] text-[#6F6A62]";
}

function MarkBadge({ mark }: { mark: SweetsMark }) {
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-sm text-xs font-semibold leading-none ${markClass(mark)}`}
    >
      {mark}
    </span>
  );
}

export function SweetsGuide({ startHref }: { startHref: "/" | "/signup" }) {
  const [sort, setSort] = useState<SweetsSort>("standard");
  const [genre, setGenre] = useState<SweetsGenre | "すべて">("すべて");
  const [mark, setMark] = useState<SweetsMarkFilter>("すべて");
  const [openNames, setOpenNames] = useState<ReadonlySet<string>>(() => new Set());

  const items = useMemo(
    () => filterSweetsItems(SWEETS_ITEMS, { genre, mark, sort }),
    [genre, mark, sort],
  );
  const sections = useMemo(() => {
    if (sort !== "standard") {
      return [{ genre: null as SweetsGenre | null, items }];
    }
    return SWEETS_GENRES.map((item) => ({
      genre: item,
      items: items.filter((row) => row.genre === item),
    })).filter((section) => section.items.length > 0);
  }, [items, sort]);
  function toggleSort() {
    setSort((current) => (current === "calorie" ? "standard" : "calorie"));
  }

  function toggleItem(name: string) {
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
        <JsonLd
          data={guideStructuredData({
            name: SWEETS_TITLE,
            description: sweetsSummary(),
            path: "/sweets",
            dateModified: GUIDE_UPDATED_ON["/sweets"],
            breadcrumbs: guideBreadcrumbItems("/sweets"),
          })}
        />
        <header id="sweets-intro">
          <Breadcrumbs items={guideBreadcrumbItems("/sweets")} includeJsonLd={false} />
          <h1 className="mt-1 text-lg font-semibold leading-6 tracking-tight text-zinc-950">{SWEETS_TITLE}</h1>
          <p className="mt-1 text-xs leading-5 text-zinc-700">{sweetsSummary()}</p>
          <p className="mt-1 text-[13px] leading-5 font-medium text-[#6B4A32]">{SWEETS_NOTICE}</p>
          <p className="mt-1 text-xs leading-4 text-zinc-700">{SWEETS_LEAD}</p>
          <table className="mt-1 w-full text-[11px] leading-4 text-[#6B4A32]">
            <tbody>
              <tr>
                <th scope="row" className="whitespace-nowrap pr-2 text-left align-top font-medium">
                  印
                </th>
                <td className="align-top">{SWEETS_MARK_SCALE}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-1 text-[11px] leading-4 text-[#6B4A32]">{SWEETS_SNACK_NOTE}</p>
        </header>

        <div className="mt-2 flex flex-col gap-1">
          <div className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip selected={genre === "すべて"} onClick={() => setGenre("すべて")}>
              すべて
            </FilterChip>
            {SWEETS_GENRES.map((item) => (
              <FilterChip key={item} selected={genre === item} onClick={() => setGenre(item)}>
                {item}
              </FilterChip>
            ))}
          </div>
          <div className="flex gap-1">
            {MARK_FILTERS.map((item) => (
              <FilterChip key={item} selected={mark === item} onClick={() => setMark(item)}>
                {item}
              </FilterChip>
            ))}
          </div>
        </div>

        <div
          id="sweets-columns"
          className={`sticky top-0 z-20 mt-2 border-b border-[#C4B39A] bg-[#E6D9C8] py-1 ${ROW_GRID}`}
        >
          <div className="text-[11px] font-medium text-[#6B4A32]">品名</div>
          <div className="text-center text-[11px] font-medium text-[#6B4A32]">1回分</div>
          <button
            type="button"
            aria-pressed={sort === "calorie"}
            className={`min-h-11 text-center text-[11px] font-medium ${
              sort === "calorie" ? "font-semibold text-[#F5821F]" : "text-[#6B4A32]"
            }`}
            onClick={toggleSort}
          >
            kcal{sort === "calorie" ? "▲" : ""}
          </button>
          <div className="text-center text-[11px] font-medium text-[#6B4A32]">印</div>
          <div className="hidden text-[11px] font-medium text-[#6B4A32] md:block">内容</div>
        </div>

        {items.length === 0 ? (
          <p className="py-4 text-sm text-zinc-700" role="status">
            {SWEETS_EMPTY}
          </p>
        ) : (
          <div>
            {sections.map((section) => (
              <section key={section.genre ?? "sorted"}>
                {section.genre ? (
                  <h2 className="flex h-7 items-center bg-[#F3EBDD] px-2 text-xs font-medium text-[#6B4A32]">
                    {section.genre}({section.items.length})
                  </h2>
                ) : null}
                {section.items.map((item) => (
                  <SweetsRow
                    key={item.name}
                    item={item}
                    open={openNames.has(item.name)}
                    onToggle={() => toggleItem(item.name)}
                  />
                ))}
              </section>
            ))}
          </div>
        )}

        <footer className="mt-4 space-y-2 text-[11px] leading-5 text-[#6B4A32]">
          <p>{SWEETS_DISCLAIMER}</p>
          <p>{SWEETS_PACKAGE_NOTE}</p>
          <GuideSentence href="/eating-out" className="pt-2" />
          <GuideAbout href="/sweets" />
          <OtherGuides currentHref="/sweets" className="pt-2" />
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

function detailText(item: SweetsItem) {
  const basis = sweetsBasisLabel(item.basis);
  return item.note ? `${item.piece} / ${basis} / ${item.note}` : `${item.piece} / ${basis}`;
}

function SweetsRow({
  item,
  open,
  onToggle,
}: {
  item: SweetsItem;
  open: boolean;
  onToggle: () => void;
}) {
  const detailId = `sweets-detail-${item.name}`;
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
        <span className="line-clamp-2 text-sm leading-[18px] text-zinc-950">{item.name}</span>
        <span className="text-center text-[11px] leading-4 tabular-nums text-zinc-800">{item.serving}</span>
        <span className="text-center text-xs tabular-nums text-zinc-800">
          {item.kcal[0]}〜{item.kcal[1]}
        </span>
        <span className="flex justify-center">
          <MarkBadge mark={sweetsMark(item.kcal)} />
        </span>
        <span className="hidden text-xs leading-4 text-zinc-700 md:line-clamp-2">{detailText(item)}</span>
      </button>
      {open ? (
        <div id={detailId} className="space-y-1 px-2 pb-2 text-xs leading-5 text-zinc-800">
          <p>{item.piece}</p>
          <p>{sweetsBasisLabel(item.basis)}</p>
          {item.note ? <p className="text-[#6B4A32]">{item.note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
