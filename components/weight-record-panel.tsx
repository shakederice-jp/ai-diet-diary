"use client";

import { useActionState, useEffect, useState } from "react";
import {
  addWeight,
  deleteWeightRecord,
  updateWeightRecord,
  type MealFormState,
} from "@/app/days/[date]/actions";
import { RecordReaction } from "@/components/record-reaction";
import {
  formatTokyoDateTime,
  formatWeightKg,
  tokyoDateTimeLocal,
  weightSourceLabel,
  type WeightDayRecord,
} from "@/lib/weight-format";

const initialState: MealFormState = { error: null, savedAt: null };
const fieldClass =
  "h-12 w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-sm outline-none focus:border-[#F5821F]";
const outlineButton =
  "inline-flex h-11 min-w-16 items-center justify-center rounded-full border px-4 text-sm font-medium disabled:brightness-90";

export function WeightRecordPanel({
  date,
  initialMeasuredAt,
  records,
  loadError,
}: {
  date: string;
  initialMeasuredAt: string;
  records: WeightDayRecord[];
  loadError: string | null;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">体重を記録</h2>
      {loadError ? (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : (
        <>
          <WeightEntryForm date={date} initialMeasuredAt={initialMeasuredAt} />
          {records.length > 0 ? (
            <ul className="mt-4 divide-y divide-[#F5821F]/20">
              {records.map((record) => (
                <WeightRow key={record.id} date={date} record={record} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              この日の体重はまだありません。
            </p>
          )}
        </>
      )}
    </section>
  );
}

function WeightEntryForm({
  date,
  initialMeasuredAt,
}: {
  date: string;
  initialMeasuredAt: string;
}) {
  const [state, formAction, pending] = useActionState(addWeight, initialState);
  const [weight, setWeight] = useState("");
  const [measuredAt, setMeasuredAt] = useState(initialMeasuredAt);
  const [appliedSavedAt, setAppliedSavedAt] = useState(state.savedAt);

  if (state.savedAt && state.savedAt !== appliedSavedAt) {
    setAppliedSavedAt(state.savedAt);
    setWeight("");
  }

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="date" value={date} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          体重 (kg)
          <input
            name="weightKg"
            required
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="例: 62.5"
            aria-label="体重 (kg)"
            className={fieldClass}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          測定日時
          <input
            type="datetime-local"
            name="measuredAt"
            required
            value={measuredAt}
            onChange={(event) => setMeasuredAt(event.target.value)}
            aria-label="測定日時"
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
      {state.error ? (
        <p className="mt-2 text-sm text-red-700">{state.error}</p>
      ) : (
        <RecordReaction reaction={state.reaction} />
      )}
    </form>
  );
}

function WeightRow({ date, record }: { date: string; record: WeightDayRecord }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const manual = record.source === "manual";
  const label = `${formatWeightKg(record.weightKg, record.source)} ${formatTokyoDateTime(record.measuredAt)}`;

  if (mode === "edit" && manual) {
    return (
      <li className="py-3">
        <WeightEditor date={date} record={record} onClose={() => setMode("view")} />
      </li>
    );
  }

  if (mode === "delete" && manual) {
    return (
      <li className="py-3">
        <WeightDeleteConfirm date={date} record={record} onClose={() => setMode("view")} />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-zinc-800">{formatTokyoDateTime(record.measuredAt)}</p>
        <p className="mt-1 text-[11px] text-zinc-500">{weightSourceLabel(record.source)}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="mr-auto font-medium text-zinc-950 sm:mr-2">
          {formatWeightKg(record.weightKg, record.source)}
        </span>
        {manual ? (
          <>
            <button
              type="button"
              onClick={() => setMode("edit")}
              aria-label={`${label}を編集`}
              className={`${outlineButton} border-[#F5821F] text-[#F5821F]`}
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => setMode("delete")}
              aria-label={`${label}を削除`}
              className={`${outlineButton} border-red-300 text-red-800`}
            >
              削除
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}

function WeightEditor({
  date,
  record,
  onClose,
}: {
  date: string;
  record: WeightDayRecord;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateWeightRecord, initialState);
  const [weight, setWeight] = useState(record.weightKg.toFixed(1));
  const [measuredAt, setMeasuredAt] = useState(tokyoDateTimeLocal(new Date(record.measuredAt)));

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
          体重 (kg)
          <input
            name="weightKg"
            required
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            aria-label="体重 (kg)"
            className={`${fieldClass} bg-white`}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          測定日時
          <input
            type="datetime-local"
            name="measuredAt"
            required
            value={measuredAt}
            onChange={(event) => setMeasuredAt(event.target.value)}
            aria-label="測定日時"
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

function WeightDeleteConfirm({
  date,
  record,
  onClose,
}: {
  date: string;
  record: WeightDayRecord;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteWeightRecord, initialState);

  return (
    <form action={formAction} className="rounded-2xl bg-[#FBF6EE] p-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="id" value={record.id} />
      <p className="text-sm text-zinc-800">
        {formatWeightKg(record.weightKg, record.source)} の記録を削除しますか？
      </p>
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
