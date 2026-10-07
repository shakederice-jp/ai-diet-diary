"use client";

import { useActionState, useEffect, useState } from "react";
import { addSteps, deleteSteps, updateSteps, type MealFormState } from "@/app/days/[date]/actions";
import { formatKcalAmount } from "@/lib/calendar";
import { stepSourceLabel, type StepDayRecord } from "@/lib/step-fields";

const initialState: MealFormState = { error: null, savedAt: null };
const fieldClass =
  "h-12 w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-sm outline-none focus:border-[#F5821F]";
const outlineButton =
  "inline-flex h-11 min-w-16 items-center justify-center rounded-full border px-4 text-sm font-medium disabled:brightness-90";

export function StepRecordPanel({
  date,
  record,
  loadError,
}: {
  date: string;
  record: StepDayRecord | null;
  loadError: string | null;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">歩数を記録</h2>
      {loadError ? (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : (
        <>
          {record ? null : <StepEntryForm date={date} />}
          {record ? (
            <ul className="mt-4 divide-y divide-[#F5821F]/20">
              <StepRow date={date} record={record} />
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">この日の歩数はまだありません。</p>
          )}
        </>
      )}
    </section>
  );
}

function StepEntryForm({ date }: { date: string }) {
  const [state, formAction, pending] = useActionState(addSteps, initialState);
  const [steps, setSteps] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [appliedSavedAt, setAppliedSavedAt] = useState(state.savedAt);

  if (state.savedAt && state.savedAt !== appliedSavedAt) {
    setAppliedSavedAt(state.savedAt);
    setSteps("");
    setDistanceKm("");
  }

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="date" value={date} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          歩数 (歩)
          <input
            name="steps"
            required
            inputMode="numeric"
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
            placeholder="例: 5000"
            aria-label="歩数 (歩)"
            className={fieldClass}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          距離 (km、任意)
          <input
            name="distanceKm"
            inputMode="decimal"
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            placeholder="例: 3.2"
            aria-label="距離 (km、任意)"
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-5 text-sm font-medium text-white disabled:brightness-90"
        >
          {pending ? "保存しています…" : "記録する"}
        </button>
      </div>
      {state.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}

function StepRow({ date, record }: { date: string; record: StepDayRecord }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const manual = record.source === "manual";
  const summary = stepSummary(record);

  if (mode === "edit" && manual) {
    return (
      <li className="py-3">
        <StepEditor date={date} record={record} onClose={() => setMode("view")} />
      </li>
    );
  }

  if (mode === "delete" && manual) {
    return (
      <li className="py-3">
        <StepDeleteConfirm date={date} record={record} onClose={() => setMode("view")} />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-zinc-800">{summary}</p>
        <p className="mt-1 text-[11px] text-zinc-500">{stepSourceLabel(record.source)}</p>
      </div>
      {manual ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("edit")}
            aria-label={`${summary}を編集`}
            className={`${outlineButton} border-[#F5821F] text-[#F5821F]`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMode("delete")}
            aria-label={`${summary}を削除`}
            className={`${outlineButton} border-red-300 text-red-800`}
          >
            削除
          </button>
        </div>
      ) : null}
    </li>
  );
}

function StepEditor({
  date,
  record,
  onClose,
}: {
  date: string;
  record: StepDayRecord;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateSteps, initialState);
  const [steps, setSteps] = useState(String(record.steps));
  const [distanceKm, setDistanceKm] = useState(
    record.distanceKm == null ? "" : record.distanceKm.toFixed(1),
  );

  useEffect(() => {
    if (state.savedAt) {
      onClose();
    }
  }, [state.savedAt, onClose]);

  return (
    <form action={formAction} className="rounded-2xl bg-[#FBF6EE] p-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="id" value={record.id} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          歩数 (歩)
          <input
            name="steps"
            required
            inputMode="numeric"
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
            aria-label="歩数 (歩)"
            className={`${fieldClass} bg-white`}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          距離 (km、任意)
          <input
            name="distanceKm"
            inputMode="decimal"
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            aria-label="距離 (km、任意)"
            className={`${fieldClass} bg-white`}
          />
        </label>
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

function StepDeleteConfirm({
  date,
  record,
  onClose,
}: {
  date: string;
  record: StepDayRecord;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteSteps, initialState);

  return (
    <form action={formAction} className="rounded-2xl bg-[#FBF6EE] p-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="id" value={record.id} />
      <p className="text-sm text-zinc-800">{stepSummary(record)} の記録を削除しますか？</p>
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

function stepSummary(record: StepDayRecord) {
  const steps = `${formatKcalAmount(record.steps)}歩`;
  if (record.distanceKm == null) {
    return steps;
  }
  return `${steps} / ${record.distanceKm.toFixed(1)} km`;
}
