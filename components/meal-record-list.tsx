"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteMealRecord,
  updateMealRecord,
  type MealFormState,
} from "@/app/days/[date]/actions";
import { ExclusiveChecks } from "@/components/exclusive-checks";
import { formatKcal } from "@/lib/calendar";
import {
  MEAL_PERIODS,
  MEAL_SOURCES,
  kcalSourceLabel,
  mealTone,
  type KcalSource,
  type MealPeriod,
  type MealSource,
} from "@/lib/meal-slot";

const kcalFigure = "font-mono tabular-nums slashed-zero";
const initialState: MealFormState = { error: null, savedAt: null };

export type MealRecordItem = {
  id: string;
  name: string;
  kcal: number;
  mealPeriod: MealPeriod;
  mealSource: MealSource | null;
  kcalSource: KcalSource;
};

const outlineButton =
  "inline-flex h-11 min-w-16 items-center justify-center rounded-full border px-4 text-sm font-medium disabled:brightness-90";

export function MealRecordList({ date, meals }: { date: string; meals: MealRecordItem[] }) {
  if (meals.length === 0) {
    return (
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">まだ記録がありません。</p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-[#F5821F]/20">
      {meals.map((meal) => (
        <MealRecordRow key={meal.id} date={date} meal={meal} />
      ))}
    </ul>
  );
}

function MealRecordRow({ date, meal }: { date: string; meal: MealRecordItem }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");

  if (mode === "edit") {
    return (
      <li className="py-3">
        <MealEditor date={date} meal={meal} onClose={() => setMode("view")} />
      </li>
    );
  }

  if (mode === "delete") {
    return (
      <li className="py-3">
        <DeleteConfirm date={date} meal={meal} onClose={() => setMode("view")} />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words text-sm text-zinc-950 dark:text-zinc-50">{meal.name}</p>
        <p className="mt-1 text-xs">
          <span style={{ color: mealTone(meal.mealPeriod, meal.mealSource) }}>
            {meal.mealPeriod}
            {meal.mealSource ? `・${meal.mealSource}` : ""}
          </span>
          <span className="ml-2 text-[11px] text-zinc-500">{kcalSourceLabel(meal.kcalSource)}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`mr-auto font-medium text-[#F5821F] sm:mr-2 ${kcalFigure}`}>
          {formatKcal(meal.kcal)}
        </span>
        <button
          type="button"
          onClick={() => setMode("edit")}
          aria-label={`${meal.name}を編集`}
          className={`${outlineButton} border-[#F5821F] text-[#F5821F]`}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => setMode("delete")}
          aria-label={`${meal.name}を削除`}
          className={`${outlineButton} border-red-300 text-red-800`}
        >
          削除
        </button>
      </div>
    </li>
  );
}

function MealEditor({
  date,
  meal,
  onClose,
}: {
  date: string;
  meal: MealRecordItem;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateMealRecord, initialState);
  const [period, setPeriod] = useState<MealPeriod>(meal.mealPeriod);
  const [source, setSource] = useState<MealSource>(meal.mealSource ?? "内食");

  useEffect(() => {
    if (state.savedAt) {
      onClose();
    }
  }, [state.savedAt, onClose]);

  return (
    <form action={formAction} className="rounded-2xl bg-[#FBF6EE] p-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="id" value={meal.id} />
      <ExclusiveChecks
        name="mealPeriod"
        legend="時間帯"
        options={MEAL_PERIODS}
        value={period}
        onChange={setPeriod}
        idPrefix={`${meal.id}-`}
      />
      <div className="mt-3">
        <ExclusiveChecks
          name="mealSource"
          legend="食事の種類"
          options={MEAL_SOURCES}
          value={period === "間食" ? null : source}
          onChange={setSource}
          disabled={period === "間食"}
          idPrefix={`${meal.id}-`}
        />
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={meal.name}
          aria-label="料理名"
          className="h-12 min-w-0 flex-1 rounded-xl border border-[#E4D7C6] bg-white px-3 text-sm outline-none focus:border-[#F5821F]"
        />
        <input
          name="kcal"
          required
          inputMode="numeric"
          maxLength={5}
          defaultValue={meal.kcal}
          aria-label="カロリー(kcal)"
          className="h-12 w-full rounded-xl border border-[#E4D7C6] bg-white px-3 text-sm outline-none focus:border-[#F5821F] sm:w-36"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#F5821F] px-5 text-sm font-medium text-white disabled:brightness-90"
        >
          {pending ? "保存しています…" : "保存"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className={`${outlineButton} border-[#F5821F] text-[#F5821F]`}
        >
          キャンセル
        </button>
      </div>
      {state.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}

function DeleteConfirm({
  date,
  meal,
  onClose,
}: {
  date: string;
  meal: MealRecordItem;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteMealRecord, initialState);

  return (
    <form action={formAction} className="rounded-2xl bg-[#FBF6EE] p-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="id" value={meal.id} />
      <p className="text-sm text-zinc-800">「{meal.name}」を削除しますか？</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-red-700 px-5 text-sm font-medium text-white disabled:brightness-90"
        >
          {pending ? "削除しています…" : "削除する"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className={`${outlineButton} border-[#F5821F] text-[#F5821F]`}
        >
          キャンセル
        </button>
      </div>
      {state.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
