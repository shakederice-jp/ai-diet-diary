"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { loadTrendSpan } from "@/app/calendar/actions";
import { MonthTrendChart, TREND_CHART_HEIGHT } from "@/components/month-trend-chart";
import { PeriodTrendChart } from "@/components/period-trend-chart";
import type { MonthTrendModel } from "@/lib/month-trend";
import type { TrendSpanModel } from "@/lib/trend-span";

const STORAGE_KEY = "trend-chart-span";
type Span = "day" | "week" | "month";
const spanListeners = new Set<() => void>();

const OPTIONS: Array<{ id: Span; label: string }> = [
  { id: "day", label: "日別" },
  { id: "week", label: "週間" },
  { id: "month", label: "月間" },
];

function readStoredSpan(): Span {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "week" || value === "month" || value === "day") {
      return value;
    }
  } catch {
    return "day";
  }
  return "day";
}

function writeStoredSpan(span: Span) {
  try {
    localStorage.setItem(STORAGE_KEY, span);
  } catch {
    return;
  }
}

function serverSpan(): Span {
  return "day";
}

function subscribeSpan(listener: () => void) {
  spanListeners.add(listener);
  return () => {
    spanListeners.delete(listener);
  };
}

function selectSpan(span: Span) {
  writeStoredSpan(span);
  for (const listener of spanListeners) {
    listener();
  }
}

function TrendTabs({ span, onSelect }: { span: Span; onSelect: (span: Span) => void }) {
  return (
    <div role="tablist" aria-label="グラフの期間" className="mt-3 grid grid-cols-3 gap-2">
      {OPTIONS.map((option) => {
        const selected = span === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={
              selected
                ? "min-h-11 rounded-full bg-[#F5821F] px-2 text-sm font-medium text-white"
                : "min-h-11 rounded-full border border-[#F5821F] bg-white px-2 text-sm font-medium text-[#F5821F]"
            }
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function TrendChartSwitch({ model }: { model: MonthTrendModel }) {
  const span = useSyncExternalStore(subscribeSpan, readStoredSpan, serverSpan);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [cache, setCache] = useState<Map<string, TrendSpanModel>>(() => new Map());
  const cached = span === "day" ? null : (cache.get(`${span}:${page}`) ?? null);

  useEffect(() => {
    if (span === "day" || cached) {
      return;
    }
    let cancelled = false;
    loadTrendSpan({ span, page })
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setCache((current) => {
          const next = new Map(current);
          next.set(`${result.model.span}:${result.model.page}`, result.model);
          return next;
        });
        if (result.model.page !== page) {
          setPage(result.model.page);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("グラフを読み込めませんでした。");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [span, page, attempt, cached]);

  function choose(next: Span) {
    selectSpan(next);
    setPage(0);
    setError(null);
    setAttempt((value) => value + 1);
  }

  const tabs = <TrendTabs span={span} onSelect={choose} />;
  const visible = cached;

  if (span === "day") {
    return <MonthTrendChart model={model} controls={tabs} />;
  }

  if (!visible) {
    return (
      <section
        className="w-full rounded-3xl bg-[#F3EBDD] p-3 shadow-sm sm:p-6"
        data-trend-chart={error ? "error" : "loading"}
        data-trend-span={span}
        aria-busy={error == null}
      >
        <h2 className="text-sm font-medium text-[#F5821F]">体重とカロリー</h2>
        <p className="mt-1 text-[11px] leading-4 text-[#8A7360]">上段 体重（kg） / 下段 摂取カロリー</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex size-11" />
          <p className="text-sm text-zinc-500">{error ?? "読み込んでいます"}</p>
          <span className="inline-flex size-11" />
        </div>
        <div style={{ height: TREND_CHART_HEIGHT }} />
        {tabs}
        <p className="mt-2 min-h-6 text-center text-[11px] leading-6 text-zinc-500">
          {span === "week"
            ? "週を押すと、その週の体重とカロリーを表示します"
            : "月を押すと、その月の体重とカロリーを表示します"}
        </p>
        <p className="mt-1 min-h-5 text-center text-[11px] leading-5 text-zinc-500" />
      </section>
    );
  }

  return (
    <PeriodTrendChart
      key={`${visible.span}-${visible.page}`}
      model={visible}
      controls={tabs as ReactNode}
      onPage={(next) => {
        setError(null);
        setPage(next);
      }}
    />
  );
}
