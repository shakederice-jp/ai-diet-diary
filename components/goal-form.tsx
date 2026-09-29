"use client";

import { useActionState, useState } from "react";
import { saveGoal, type GoalFormState } from "@/app/goals/actions";
import { ChoiceField } from "@/components/choice-field";
import { PERIOD_OPTIONS, type PeriodUnit } from "@/lib/calorie-plan";

const initialState: GoalFormState = { error: null, savedAt: null };
const fieldClass =
  "h-12 w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-sm outline-none focus:border-[#F5821F]";

export function GoalForm({
  initial,
  weightHint,
}: {
  initial: {
    currentWeightKg: string;
    targetWeightKg: string;
    periodUnit: PeriodUnit;
    periodCount: string;
  };
  weightHint: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveGoal, initialState);
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(initial.periodUnit);
  const [periodCount, setPeriodCount] = useState(initial.periodCount);
  const maxCount = periodUnit === "weeks" ? 104 : 36;

  function selectUnit(unit: PeriodUnit) {
    setPeriodUnit(unit);
    const nextMax = unit === "weeks" ? 104 : 36;
    const current = Number(periodCount);
    if (Number.isFinite(current) && current > nextMax) {
      setPeriodCount(String(nextMax));
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-950">
        現在の体重 (kg)
        <input
          name="currentWeightKg"
          required
          inputMode="decimal"
          min={20}
          max={300}
          step={0.1}
          defaultValue={initial.currentWeightKg}
          placeholder="例: 62.5"
          aria-label="現在の体重 (kg)"
          className={fieldClass}
        />
        {weightHint ? <span className="text-xs font-normal text-zinc-600">{weightHint}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-950">
        目標体重 (kg)
        <input
          name="targetWeightKg"
          required
          inputMode="decimal"
          min={20}
          max={300}
          step={0.1}
          defaultValue={initial.targetWeightKg}
          placeholder="例: 58.0"
          aria-label="目標体重 (kg)"
          className={fieldClass}
        />
      </label>

      <ChoiceField
        name="periodUnit"
        legend="達成までの期間"
        value={periodUnit}
        options={PERIOD_OPTIONS}
        onChange={selectUnit}
      />

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-950">
        {periodUnit === "weeks" ? "週数" : "何か月後"}
        <span className="flex items-center gap-2">
          <input
            name="periodCount"
            required
            inputMode="numeric"
            min={1}
            max={maxCount}
            step={1}
            value={periodCount}
            onChange={(event) => setPeriodCount(event.target.value)}
            placeholder={periodUnit === "weeks" ? "例: 12" : "例: 3"}
            aria-label={periodUnit === "weeks" ? "達成までの週数" : "達成までの月数"}
            className={`${fieldClass} min-w-0 flex-1`}
          />
          <span className="shrink-0 text-sm font-normal text-zinc-600">
            {periodUnit === "weeks" ? "週" : "か月後"}
          </span>
        </span>
      </label>

      <p className="text-xs leading-5 text-zinc-600">
        保存すると、改良版ハリス・ベネディクト式で基礎代謝を計算し、活動量（デスクワーク中心
        1.2、立ち仕事や軽い運動あり 1.55、よく運動する
        1.725）を掛けた消費カロリーから、体重差 × 7,000kcal
        を期間の日数で割った分を引きます。下限は女性 1,200kcal、男性 1,500kcal
        です。回答しない場合は男女の式の平均を使い、下限は 1,500kcal です。
      </p>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C] disabled:opacity-60 sm:w-auto"
      >
        {pending ? "計算しています…" : "保存して計算する"}
      </button>

      <div aria-live="polite">
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        {state.savedAt ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            目標を保存しました。カレンダーと各日の進捗にこの週の目標を使います。
          </p>
        ) : null}
      </div>
    </form>
  );
}
