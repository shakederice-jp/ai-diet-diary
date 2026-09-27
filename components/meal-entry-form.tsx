"use client";

import { useActionState, useEffect, useRef } from "react";
import { addMeal, type MealFormState } from "@/app/days/[date]/actions";

const initialState: MealFormState = { error: null, savedAt: null };

export function MealEntryForm({ date }: { date: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addMeal, initialState);

  useEffect(() => {
    if (state.savedAt) {
      formRef.current?.reset();
    }
  }, [state.savedAt]);

  return (
    <form ref={formRef} action={formAction} className="mt-6">
      <input type="hidden" name="date" value={date} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="料理名"
          aria-label="料理名"
          className="h-12 w-full flex-1 rounded-xl border border-[#F5821F]/40 px-4 text-sm outline-none focus:border-[#F5821F]"
        />
        <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="saveFavorite"
            className="size-4 accent-[#F5821F]"
          />
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
