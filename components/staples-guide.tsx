"use client";

import { useEffect, useState } from "react";
import {
  BREAD_NOTE,
  BREAD_ROWS,
  NOODLE_ROWS,
  OTHER_ROWS,
  PASTA_NOTE,
  RICE_NOTE,
  RICE_ROWS,
  STAPLES_NOTICE,
  STAPLES_TITLE,
  otherKcalLabel,
  type StapleAmountRow,
} from "@/lib/staples-guide";

export function StaplesGuide() {
  const [desktop, setDesktop] = useState(false);
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const open = override ?? desktop;

  return (
    <section id="staples-guide" className="mt-2">
      <button
        type="button"
        id="staples-toggle"
        aria-expanded={open}
        aria-controls="staples-panel"
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl bg-[#F3EBDD] px-3 text-left text-[13px] font-medium text-[#6B4A32]"
        onClick={() => setOverride(!open)}
      >
        <span>{STAPLES_TITLE}</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <div id="staples-panel" className="mt-1 rounded-xl bg-[#FBF6EE] px-2 py-2">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-x-4">
            <AmountTable title="ご飯" amountHeader="量(g)" rows={RICE_ROWS} note={RICE_NOTE} />
            <AmountTable title="パン" amountHeader="量" rows={BREAD_ROWS} note={BREAD_NOTE} />
            <NoodleTable />
            <AmountTable title="その他の主食" amountHeader="量" rows={OTHER_ROWS} />
          </div>
          <p className="mt-2 text-[12px] leading-4 text-[#6B4A32]">{STAPLES_NOTICE}</p>
        </div>
      ) : null}
    </section>
  );
}

function AmountTable({
  title,
  amountHeader,
  rows,
  note,
}: {
  title: string;
  amountHeader: string;
  rows: readonly StapleAmountRow[];
  note?: string;
}) {
  return (
    <section>
      <h3 className="text-[13px] font-medium text-[#F5821F]">{title}</h3>
      <table className="mt-0.5 w-full text-[13px] leading-4 text-zinc-900">
        <thead>
          <tr className="text-[12px] text-[#8A7360]">
            <th scope="col" className="py-px pr-2 text-left font-medium">
              内容
            </th>
            <th scope="col" className="py-px pr-2 text-right font-medium">
              {amountHeader}
            </th>
            <th scope="col" className="py-px text-right font-medium">
              kcal
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-[#E7DCC8]">
              <th scope="row" className="py-px pr-2 text-left font-normal">
                {row.label}
                {row.note ? <span className="ml-1 text-[12px] text-[#8A7360]">({row.note})</span> : null}
              </th>
              <td className="py-px pr-2 text-right tabular-nums">{row.amount}</td>
              <td className="py-px text-right font-medium tabular-nums">{otherKcalLabel(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note ? <p className="mt-1 text-[12px] leading-4 text-[#6B4A32]">{note}</p> : null}
    </section>
  );
}

function NoodleTable() {
  return (
    <section>
      <h3 className="text-[13px] font-medium text-[#F5821F]">麺</h3>
      <p className="text-[12px] leading-4 text-[#8A7360]">スープ・具・ソースは含まない。大盛は麺を1.5倍にした目安。</p>
      <table className="mt-0.5 w-full text-[13px] leading-4 text-zinc-900">
        <thead>
          <tr className="text-[12px] text-[#8A7360]">
            <th scope="col" className="py-px pr-1 text-left font-medium">
              種類
            </th>
            <th scope="col" className="py-px pr-1 text-right font-medium">
              並
            </th>
            <th scope="col" className="py-px pr-1 text-right font-medium">
              大盛
            </th>
            <th scope="col" className="py-px text-right font-medium">
              差
            </th>
          </tr>
        </thead>
        <tbody>
          {NOODLE_ROWS.map((row) => (
            <tr key={row.label} className="border-t border-[#E7DCC8]">
              <th scope="row" className="py-px pr-1 text-left font-normal">
                {row.label}
              </th>
              <td className="py-px pr-1 text-right text-[12px] tabular-nums">
                {row.regularGrams}g {row.regularKcal}kcal
              </td>
              <td className="py-px pr-1 text-right text-[12px] tabular-nums">
                {row.largeGrams}g {row.largeKcal}kcal
              </td>
              <td className="py-px text-right text-[12px] font-medium tabular-nums">+{row.deltaKcal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[12px] leading-4 text-[#6B4A32]">{PASTA_NOTE}</p>
    </section>
  );
}
