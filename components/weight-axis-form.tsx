"use client";

import { useActionState, useState, type FormEvent } from "react";
import { saveWeightAxisForm, type WeightAxisFormState } from "@/app/mypage/actions";
import { navPrimary, navSecondary } from "@/components/nav-styles";
import { parseWeightAxisFields } from "@/lib/weight-axis";

const initialState: WeightAxisFormState = {
  error: null,
  notice: null,
  savedAt: null,
  minKg: "",
  maxKg: "",
};

const fieldClass =
  "h-[52px] w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-base text-zinc-950 outline-none focus:border-[#F5821F]";

export function WeightAxisForm({
  initialMinKg,
  initialMaxKg,
  loadError,
}: {
  initialMinKg: string;
  initialMaxKg: string;
  loadError: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveWeightAxisForm, initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [hideNotice, setHideNotice] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"save" | "auto">("save");
  const [appliedSavedAt, setAppliedSavedAt] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (state.savedAt && state.savedAt !== appliedSavedAt) {
    setAppliedSavedAt(state.savedAt);
    setFormKey(state.savedAt);
    setClientError(null);
    setHideNotice(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    const intent = submitter instanceof HTMLButtonElement && submitter.value === "auto" ? "auto" : "save";
    if (intent === "auto") {
      setSubmitIntent("auto");
      setClientError(null);
      return;
    }
    const data = new FormData(event.currentTarget);
    const parsed = parseWeightAxisFields(String(data.get("minKg") ?? ""), String(data.get("maxKg") ?? ""));
    if (!parsed.ok) {
      event.preventDefault();
      setClientError(parsed.message);
      return;
    }
    setSubmitIntent("save");
    setClientError(null);
  }

  const saved = state.savedAt != null;
  const minKg = saved ? state.minKg : initialMinKg;
  const maxKg = saved ? state.maxKg : initialMaxKg;
  const error = clientError ?? state.error ?? (saved ? null : loadError);
  const notice = hideNotice || error ? null : state.notice;

  return (
    <section className="mt-8 border-t border-[#E4D7C6] pt-4">
      <h2 className="text-xs font-medium text-zinc-500">体重グラフの縦軸</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">空欄のときは、いままでどおり自動で決まります。</p>
      <form key={formKey} action={formAction} onSubmit={onSubmit} className="mt-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-zinc-950">
            下限 (kg)
            <input
              name="minKg"
              defaultValue={minKg}
              onChange={() => {
                setClientError(null);
                setHideNotice(true);
              }}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder="例: 60"
              aria-label="下限 (kg)"
              className={fieldClass}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-zinc-950">
            上限 (kg)
            <input
              name="maxKg"
              defaultValue={maxKg}
              onChange={() => {
                setClientError(null);
                setHideNotice(true);
              }}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder="例: 70"
              aria-label="上限 (kg)"
              className={fieldClass}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={pending}
            className={`${navPrimary} disabled:opacity-70`}
          >
            {pending && submitIntent === "save" ? "保存しています…" : "保存する"}
          </button>
          <button
            type="submit"
            name="intent"
            value="auto"
            disabled={pending}
            className={`${navSecondary} disabled:opacity-70`}
          >
            {pending && submitIntent === "auto" ? "戻しています…" : "自動に戻す"}
          </button>
        </div>
        <div aria-live="polite" className="mt-3">
          {error ? <p className="text-sm leading-6 text-red-800">{error}</p> : null}
          {notice ? <p className="text-sm leading-6 text-zinc-600">{notice}</p> : null}
        </div>
      </form>
    </section>
  );
}
