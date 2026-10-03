"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addMeal, type MealFormState } from "@/app/days/[date]/actions";
import { ExclusiveChecks } from "@/components/exclusive-checks";
import { RecordReaction } from "@/components/record-reaction";
import { MEAL_PERIODS, MEAL_SOURCES, type MealPeriod, type MealSource } from "@/lib/meal-slot";

const initialState: MealFormState = { error: null, savedAt: null, reaction: null };

export function MealEntryForm({
  date,
  initialPeriod,
}: {
  date: string;
  initialPeriod: MealPeriod;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addMeal, initialState);
  const [period, setPeriod] = useState<MealPeriod>(initialPeriod);
  const [source, setSource] = useState<MealSource>("内食");
  const [manualKcal, setManualKcal] = useState("");

  useEffect(() => {
    if (!state.savedAt) {
      return;
    }
    const form = formRef.current;
    const name = form?.elements.namedItem("name");
    if (name instanceof HTMLInputElement) {
      name.value = "";
    }
    const kcal = form?.elements.namedItem("kcal");
    if (kcal instanceof HTMLInputElement) {
      kcal.value = "";
    }
    const favorite = form?.elements.namedItem("saveFavorite");
    if (favorite instanceof HTMLInputElement) {
      favorite.checked = false;
    }
    setManualKcal("");
    setPeriod(initialPeriod);
    setSource("内食");
  }, [state.savedAt, initialPeriod]);

  return (
    <form ref={formRef} action={formAction} className="mt-6">
      <input type="hidden" name="date" value={date} />
      <ExclusiveChecks
        name="mealPeriod"
        legend="時間帯"
        options={MEAL_PERIODS}
        value={period}
        onChange={setPeriod}
      />
      <div className="mt-4">
        <ExclusiveChecks
          name="mealSource"
          legend="食事の種類"
          options={MEAL_SOURCES}
          value={period === "間食" ? null : source}
          onChange={setSource}
          disabled={period === "間食"}
        />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="料理名"
          aria-label="料理名"
          className="h-12 min-w-0 flex-1 rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-sm outline-none focus:border-[#F5821F]"
        />
        <input
          name="kcal"
          inputMode="numeric"
          maxLength={5}
          value={manualKcal}
          onChange={(event) => setManualKcal(event.target.value)}
          placeholder="カロリー(kcal、任意)"
          aria-label="カロリー(kcal、任意)"
          className="h-12 w-40 shrink-0 rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-sm outline-none focus:border-[#F5821F] sm:w-52"
        />
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name="saveFavorite" className="size-5 accent-[#F5821F]" />
        よく使うメニューに登録
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C] disabled:brightness-90"
      >
        {pending
          ? manualKcal.trim()
            ? "記録しています…"
            : "カロリーを推定しています…"
          : "記録する"}
      </button>
      {state.error ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300">{state.error}</p>
      ) : (
        <RecordReaction reaction={state.reaction} />
      )}
    </form>
  );
}
