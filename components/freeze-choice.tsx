"use client";

import { useActionState } from "react";
import { declineStreakFreeze, useStreakFreeze, type FreezeFormState } from "@/app/engagement/actions";

const initialState: FreezeFormState = { error: null };
const button =
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium disabled:opacity-60";

export function FreezeChoice({ missedOn, label }: { missedOn: string; label: string }) {
  const [useState, useAction, usePending] = useActionState(useStreakFreeze, initialState);
  const [skipState, skipAction, skipPending] = useActionState(declineStreakFreeze, initialState);
  const pending = usePending || skipPending;
  const error = useState.error ?? skipState.error;

  return (
    <div className="mt-3">
      <p className="text-sm leading-6 text-zinc-800">
        {label}は記録がありません。フリーズを使いますか？使うと、その日は記録がなくても連続記録が続きます。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={useAction}>
          <input type="hidden" name="missedOn" value={missedOn} />
          <button type="submit" disabled={pending} className={`${button} bg-[#F5821F] text-white`}>
            {usePending ? "保存しています…" : "フリーズを使う"}
          </button>
        </form>
        <form action={skipAction}>
          <input type="hidden" name="missedOn" value={missedOn} />
          <button
            type="submit"
            disabled={pending}
            className={`${button} border border-[#E4D7C6] bg-[#FBF6EE] text-zinc-800`}
          >
            {skipPending ? "保存しています…" : "使わない"}
          </button>
        </form>
      </div>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
