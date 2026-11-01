"use client";

import { useState } from "react";
import { deleteMealRecord, updateMealRecord, type MealFormState } from "@/app/days/[date]/actions";
import { ExclusiveChecks } from "@/components/exclusive-checks";
import type { MealRecordItem } from "@/components/meal-record-list";
import { formatKcal } from "@/lib/calendar";
import { MANUAL_KCAL_ERROR } from "@/lib/bulk-meals";
import { parseManualKcal } from "@/lib/manual-kcal";
import {
  MEAL_SOURCES,
  kcalSourceLabel,
  type MealPeriod,
  type MealSource,
} from "@/lib/meal-slot";

const kcalFigure = "font-mono tabular-nums slashed-zero";
const idleState: MealFormState = { error: null, savedAt: null };
const nameClass =
  "h-11 min-w-0 flex-1 rounded-xl border border-[#E4D7C6] bg-white px-3 text-base outline-none focus:border-[#F5821F]";
const kcalClass =
  "h-11 w-[5.5rem] shrink-0 rounded-xl border border-[#E4D7C6] bg-white px-2 text-base tabular-nums outline-none focus:border-[#F5821F]";

type EditRow = {
  id: string;
  name: string;
  kcalText: string;
  originalName: string;
  originalKcal: number;
  originalSource: MealSource | null;
};

function uniqueSources(meals: MealRecordItem[]) {
  const sources: MealSource[] = [];
  for (const meal of meals) {
    if (meal.mealSource && !sources.includes(meal.mealSource)) {
      sources.push(meal.mealSource);
    }
  }
  return sources;
}

function toRows(meals: MealRecordItem[]): EditRow[] {
  return meals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    kcalText: String(meal.kcal),
    originalName: meal.name,
    originalKcal: meal.kcal,
    originalSource: meal.mealSource,
  }));
}

export function RecordedMealCard({
  date,
  period,
  meals,
}: {
  date: string;
  period: MealPeriod;
  meals: MealRecordItem[];
}) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [source, setSource] = useState<MealSource>("内食");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const sources = uniqueSources(meals);

  function beginEdit() {
    setRows(toRows(meals));
    setSource(sources[0] ?? "内食");
    setError(null);
    setRowErrors({});
    setConfirmId(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (pending) {
      return;
    }
    setEditing(false);
    setError(null);
    setRowErrors({});
    setConfirmId(null);
  }

  async function save() {
    if (pending) {
      return;
    }
    const nextErrors: Record<string, string> = {};
    for (const row of rows) {
      if (!row.name.trim()) {
        nextErrors[row.id] = "料理名を入力してください。";
      } else if (parseManualKcal(row.kcalText) === null) {
        nextErrors[row.id] = MANUAL_KCAL_ERROR;
      }
    }
    setRowErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPending(true);
    setError(null);
    const nextSource = period === "間食" ? null : source;
    for (const row of rows) {
      const kcal = parseManualKcal(row.kcalText);
      if (kcal === null) {
        continue;
      }
      const name = row.name.trim();
      const changed =
        name !== row.originalName || kcal !== row.originalKcal || nextSource !== row.originalSource;
      if (!changed) {
        continue;
      }
      const body = new FormData();
      body.set("date", date);
      body.set("id", row.id);
      body.set("name", name);
      body.set("kcal", String(kcal));
      body.set("mealPeriod", period);
      if (nextSource) {
        body.set("mealSource", nextSource);
      }
      const result = await updateMealRecord(idleState, body);
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
    }
    setPending(false);
    setEditing(false);
  }

  async function remove(row: EditRow) {
    if (pending) {
      return;
    }
    setPending(true);
    setError(null);
    const body = new FormData();
    body.set("date", date);
    body.set("id", row.id);
    const result = await deleteMealRecord(idleState, body);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmId(null);
    const remaining = rows.filter((item) => item.id !== row.id);
    setRows(remaining);
    if (remaining.length === 0) {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-2 rounded-2xl bg-[#E7DCC8] p-3">
        {period === "間食" ? null : (
          <ExclusiveChecks
            name={`recorded-source-${period}`}
            legend="食事の種類"
            options={MEAL_SOURCES}
            value={source}
            onChange={setSource}
            disabled={pending}
            idPrefix={`recorded-${period}-`}
          />
        )}
        <ul className={period === "間食" ? "" : "mt-3"}>
          {rows.map((row) => {
            const problem = rowErrors[row.id];
            return (
              <li key={row.id} className="border-b border-[#F3EBDD] py-2 last:border-b-0">
                {confirmId === row.id ? (
                  <div>
                    <p className="text-sm text-zinc-800">「{row.name.trim() || row.originalName}」を削除しますか？</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => remove(row)}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-red-700 px-5 text-sm font-medium text-white disabled:brightness-90"
                      >
                        {pending ? "削除しています…" : "削除する"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setConfirmId(null)}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-[#F5821F] px-4 text-sm font-medium text-[#F5821F]"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-1">
                    <input
                      value={row.name}
                      maxLength={80}
                      disabled={pending}
                      aria-label={`${period}の${row.originalName}の品名`}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, name: event.target.value } : item,
                          ),
                        )
                      }
                      className={nameClass}
                    />
                    <input
                      value={row.kcalText}
                      inputMode="numeric"
                      maxLength={5}
                      disabled={pending}
                      aria-label={`${period}の${row.originalName}のカロリー`}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, kcalText: event.target.value } : item,
                          ),
                        )
                      }
                      className={kcalClass}
                    />
                    <button
                      type="button"
                      disabled={pending}
                      aria-label={`${row.originalName}を削除`}
                      onClick={() => setConfirmId(row.id)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-xl leading-none text-zinc-500 hover:bg-[#F3EBDD]"
                    >
                      ×
                    </button>
                  </div>
                )}
                {problem ? <p className="mt-1 text-xs text-red-700">{problem}</p> : null}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#F5821F] px-5 text-sm font-medium text-white disabled:brightness-90"
          >
            {pending ? "保存しています…" : "保存する"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={cancelEdit}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#F5821F] bg-transparent px-4 text-sm font-medium text-[#F5821F]"
          >
            キャンセル
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl bg-[#E7DCC8] p-3">
      <div className="flex items-center justify-between gap-2">
        {period === "間食" || sources.length === 0 ? (
          <span />
        ) : (
          <p className="text-xs text-zinc-600">{sources.join("・")}</p>
        )}
        <button
          type="button"
          onClick={beginEdit}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-[#F5821F] px-3 text-sm font-medium whitespace-nowrap text-[#F5821F]"
        >
          修正する
        </button>
      </div>
      <ul className="mt-1">
        {meals.map((meal) => (
          <li
            key={meal.id}
            className="flex min-h-10 items-center justify-between gap-3 border-b border-[#F3EBDD] py-1 last:border-b-0"
          >
            <p className="min-w-0 break-words text-sm text-zinc-950">{meal.name}</p>
            <p className="flex shrink-0 items-baseline gap-2">
              <span className={`text-sm font-medium text-zinc-800 ${kcalFigure}`}>{formatKcal(meal.kcal)}</span>
              <span className="text-[11px] text-zinc-500">{kcalSourceLabel(meal.kcalSource)}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
