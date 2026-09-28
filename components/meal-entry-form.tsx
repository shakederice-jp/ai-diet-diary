"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addMeal, type MealFormState } from "@/app/days/[date]/actions";
import { MEAL_PERIODS, MEAL_SOURCES, type MealPeriod, type MealSource } from "@/lib/meal-slot";

const initialState: MealFormState = { error: null, savedAt: null };

function ExclusiveChecks<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  legend: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className={disabled ? "opacity-50" : undefined}>
      <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${name}-${option}`;
          const selected = value === option;
          return (
            <label
              key={option}
              htmlFor={id}
              className={`flex min-h-11 min-w-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm text-zinc-800 dark:text-zinc-200 ${
                selected ? "border-[#F5821F] bg-white" : "border-[#E4D7C6] bg-[#FBF6EE]"
              } ${disabled ? "cursor-not-allowed" : ""}`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option)}
                className="size-5 shrink-0 appearance-none rounded-[4px] border-2 border-[#C4B39A] bg-white checked:border-[#F5821F] checked:bg-[#F5821F]"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

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

  useEffect(() => {
    if (!state.savedAt) {
      return;
    }
    const form = formRef.current;
    const name = form?.elements.namedItem("name");
    if (name instanceof HTMLInputElement) {
      name.value = "";
    }
    const favorite = form?.elements.namedItem("saveFavorite");
    if (favorite instanceof HTMLInputElement) {
      favorite.checked = false;
    }
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
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="料理名"
          aria-label="料理名"
          className="h-12 w-full flex-1 rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-sm outline-none focus:border-[#F5821F]"
        />
        <label className="flex min-h-11 shrink-0 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" name="saveFavorite" className="size-5 accent-[#F5821F]" />
          よく使うメニューに登録
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C] disabled:opacity-60"
      >
        {pending ? "カロリーを推定しています…" : "記録する"}
      </button>
      {state.error ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300">{state.error}</p>
      ) : null}
    </form>
  );
}
