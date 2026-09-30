"use client";

import { useActionState, useState } from "react";
import { saveAdvisor, type AdvisorFormState } from "@/app/mypage/actions";
import { ADVISOR_DISCLAIMER, ADVISORS, type AdvisorId } from "@/lib/advisors";

const initialState: AdvisorFormState = { error: null, savedAt: null };

export function AdvisorPicker({ initialId }: { initialId: AdvisorId | null }) {
  const [state, formAction, pending] = useActionState(saveAdvisor, initialState);
  const [advisorId, setAdvisorId] = useState<AdvisorId | "">(initialId ?? "");

  return (
    <form action={formAction} className="mt-8">
      <p className="text-sm font-medium text-[#F5821F]">健康アドバイザーAI</p>
      <p className="mt-1 text-xs leading-5 text-zinc-600">{ADVISOR_DISCLAIMER}</p>
      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-medium text-zinc-950">使うアドバイザー</legend>
        {ADVISORS.map((advisor) => {
          const selected = advisorId === advisor.id;
          return (
            <label
              key={advisor.id}
              className={
                selected
                  ? "flex cursor-pointer flex-col rounded-2xl border-2 border-[#F5821F] bg-[#FBF6EE] px-4 py-3"
                  : "flex cursor-pointer flex-col rounded-2xl border border-[#E4D7C6] bg-[#FBF6EE] px-4 py-3"
              }
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="advisorId"
                  value={advisor.id}
                  checked={selected}
                  required
                  onChange={() => setAdvisorId(advisor.id)}
                  className="accent-[#F5821F]"
                />
                <span className="text-sm font-medium text-zinc-950">{advisor.name}</span>
              </span>
              <span className="mt-1 pl-6 text-xs leading-5 text-zinc-600">{advisor.description}</span>
            </label>
          );
        })}
      </fieldset>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C] disabled:opacity-60"
      >
        {pending ? "保存しています…" : "このアドバイザーを使う"}
      </button>
      <div aria-live="polite">
        {state.error ? <p className="mt-3 text-sm text-red-700">{state.error}</p> : null}
        {state.savedAt ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            保存しました。食事を記録した日のコメントに、この口調を使います。
          </p>
        ) : null}
      </div>
    </form>
  );
}
