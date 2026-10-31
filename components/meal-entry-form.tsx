"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ClipboardEvent, type KeyboardEvent } from "react";
import { estimateBulkMeals, saveBulkMeals, type MealFormState } from "@/app/days/[date]/actions";
import { ExclusiveChecks } from "@/components/exclusive-checks";
import { GuideLinks } from "@/components/guide-links";
import { RecordReaction } from "@/components/record-reaction";
import {
  appendDraftRow,
  applyMultilinePaste,
  blankMealRow,
  bulkLineProblem,
  draftKcalProblem,
  draftRowName,
  insertRowBelow,
  namedDraftCount,
  pastedMealNames,
  placeVoiceName,
  removeDraftRow,
  speechInputAvailable,
  type DraftMealRow,
} from "@/lib/bulk-meals";
import { parseManualKcal } from "@/lib/manual-kcal";
import { formatKcal } from "@/lib/calendar";
import type { GuideLink } from "@/lib/guide-links";
import {
  MEAL_PERIODS,
  MEAL_SOURCES,
  bulkEntryPeriods,
  kcalSourceLabel,
  tokyoDateKey,
  tokyoHour,
  type KcalSource,
  type MealPeriod,
  type MealSource,
} from "@/lib/meal-slot";

const DAY_GUIDE_LABELS: Partial<Record<GuideLink["href"], string>> = {
  "/eating-out": "外食メニューのカロリー目安を見る",
  "/sweets": "お菓子・スイーツのカロリー目安を見る",
};

const nameClass =
  "h-12 min-w-0 flex-1 rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-base outline-none focus:border-[#F5821F]";
const kcalClass =
  "h-12 w-[5.5rem] shrink-0 rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-2 text-base tabular-nums outline-none focus:border-[#F5821F]";
const primaryButton =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#F5821F] px-6 text-base font-medium text-white hover:bg-[#E06E0C] disabled:brightness-90";
const kcalFigure = "font-mono tabular-nums slashed-zero";

type SpeechResult = { isFinal: boolean; 0: { transcript: string }; length: number };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type Clock = { today: string; hour: number };
type ConfirmLine = {
  key: string;
  name: string;
  mealPeriod: MealPeriod;
  mealSource: MealSource | null;
  estimated: number | null;
  enteredManually: boolean;
  kcalText: string;
};
type Drafts = Record<MealPeriod, DraftMealRow[]>;

const serverClock: Clock | null = null;
let clientClock: Clock | null = null;

function readClock(): Clock {
  if (!clientClock) {
    clientClock = { today: tokyoDateKey(), hour: tokyoHour() };
  }
  return clientClock;
}

function subscribeClock() {
  return () => undefined;
}

function speechConstructor() {
  if (typeof window === "undefined") {
    return null;
  }
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

function browserSpeechAvailable() {
  if (typeof window === "undefined") {
    return false;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const ios =
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  return speechInputAvailable({
    hasApi: speechConstructor() !== null,
    ios,
    standalone,
  });
}

function periodTotal(meals: Array<{ mealPeriod: MealPeriod; kcal: number }>, period: MealPeriod) {
  return meals.filter((meal) => meal.mealPeriod === period).reduce((sum, meal) => sum + meal.kcal, 0);
}

function emptyDrafts(): Drafts {
  return {
    朝食: [blankMealRow("init-breakfast")],
    昼食: [blankMealRow("init-lunch")],
    夕食: [blankMealRow("init-dinner")],
    間食: [blankMealRow("init-snack")],
  };
}

function focusName(key: string) {
  requestAnimationFrame(() => {
    document.getElementById(`bulk-name-${key}`)?.focus();
  });
}

export function MealEntryForm({
  date,
  meals,
}: {
  date: string;
  meals: Array<{ mealPeriod: MealPeriod; kcal: number }>;
}) {
  const clock = useSyncExternalStore(subscribeClock, readClock, () => serverClock);
  const speechOk = useSyncExternalStore(subscribeClock, browserSpeechAvailable, () => null as boolean | null);
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<Record<Exclude<MealPeriod, "間食">, MealSource>>({
    朝食: "内食",
    昼食: "内食",
    夕食: "内食",
  });
  const [revealed, setRevealed] = useState<MealPeriod[]>([]);
  const [phase, setPhase] = useState<"edit" | "estimating" | "confirm" | "saving">("edit");
  const [confirmLines, setConfirmLines] = useState<ConfirmLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [listening, setListening] = useState<MealPeriod | null>(null);
  const [reaction, setReaction] = useState<MealFormState["reaction"]>(null);
  const busy = useRef(false);
  const recognition = useRef<SpeechRec | null>(null);
  const lineKey = useRef(0);

  useEffect(() => {
    return () => {
      const active = recognition.current;
      recognition.current = null;
      try {
        active?.abort();
      } catch {
        // すでに止まっている。
      }
    };
  }, []);

  function nextRowKey() {
    lineKey.current += 1;
    return `row-${lineKey.current}`;
  }

  const basePeriods = clock ? bulkEntryPeriods(date, clock.today, clock.hour) : [...MEAL_PERIODS];
  const shown = MEAL_PERIODS.filter((period) => basePeriods.includes(period) || revealed.includes(period));
  const hiddenLinks = (["昼食", "夕食"] as const).filter((period) => !shown.includes(period));

  function clearRowError(key: string) {
    setRowErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateRow(period: MealPeriod, key: string, patch: Partial<Pick<DraftMealRow, "name" | "kcal">>) {
    setDrafts((current) => ({
      ...current,
      [period]: current[period].map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
    clearRowError(key);
  }

  function stopListening() {
    const active = recognition.current;
    recognition.current = null;
    setListening(null);
    if (!active) {
      return;
    }
    active.onresult = null;
    active.onerror = null;
    active.onend = null;
    try {
      active.abort();
    } catch {
      try {
        active.stop();
      } catch {
        // すでに止まっている。
      }
    }
  }

  function toggleListening(period: MealPeriod) {
    if (listening === period) {
      const active = recognition.current;
      if (active) {
        try {
          active.stop();
        } catch {
          stopListening();
        }
      }
      return;
    }
    const Ctor = speechConstructor();
    if (!Ctor) {
      return;
    }
    stopListening();
    const next = new Ctor();
    next.lang = "ja-JP";
    next.continuous = true;
    next.interimResults = false;
    next.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result?.isFinal) {
          continue;
        }
        const transcript = result[0]?.transcript ?? "";
        const key = nextRowKey();
        setDrafts((current) => ({
          ...current,
          [period]: placeVoiceName(current[period], transcript, key),
        }));
      }
    };
    next.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMicError("マイクの使用が許可されていません。キーボードのマイクボタンをお使いください");
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setMicError("音声を認識できませんでした。キーボードから入力してください。");
      }
      setListening(null);
    };
    next.onend = () => {
      if (recognition.current === next) {
        recognition.current = null;
        setListening(null);
      }
    };
    recognition.current = next;
    try {
      next.start();
      setListening(period);
      setMicError(null);
    } catch {
      stopListening();
      setMicError("音声を認識できませんでした。キーボードから入力してください。");
    }
  }

  function onNameKeyDown(period: MealPeriod, index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }
    event.preventDefault();
    const rows = drafts[period];
    const last = rows[rows.length - 1];
    if (!last || draftRowName(last).length === 0) {
      if (last && rows[index]?.key !== last.key) {
        focusName(last.key);
      }
      return;
    }
    const key = nextRowKey();
    const next = insertRowBelow(rows, index, key);
    if (!next) {
      return;
    }
    setDrafts((current) => ({ ...current, [period]: next }));
    focusName(key);
  }

  function onNamePaste(period: MealPeriod, index: number, event: ClipboardEvent<HTMLInputElement>) {
    const lines = pastedMealNames(event.clipboardData.getData("text"));
    if (!lines) {
      return;
    }
    event.preventDefault();
    const keys = lines.slice(1).map(() => nextRowKey());
    let focusKey = "";
    setDrafts((current) => {
      const namedElsewhere = MEAL_PERIODS.filter((item) => item !== period).reduce(
        (sum, item) => sum + namedDraftCount(current[item]),
        0,
      );
      const applied = applyMultilinePaste({
        rows: current[period],
        index,
        lines,
        namedElsewhere,
        keys,
      });
      focusKey = applied.focusKey;
      return { ...current, [period]: applied.rows };
    });
    if (focusKey) {
      focusName(focusKey);
    }
  }

  function addRow(period: MealPeriod) {
    const key = nextRowKey();
    let focusKey = key;
    setDrafts((current) => {
      const appended = appendDraftRow(current[period], key);
      focusKey = appended[appended.length - 1]?.key ?? key;
      return { ...current, [period]: appended };
    });
    focusName(focusKey);
  }

  function deleteRow(period: MealPeriod, key: string) {
    const blankKey = nextRowKey();
    setDrafts((current) => ({
      ...current,
      [period]: removeDraftRow(current[period], key, blankKey),
    }));
    clearRowError(key);
  }

  function collectLines() {
    const errors: Record<string, string> = {};
    const lines: Array<{ name: string; mealPeriod: MealPeriod; mealSource: MealSource | null; kcal: string }> = [];
    for (const period of shown) {
      for (const row of drafts[period]) {
        const name = draftRowName(row);
        const kcal = row.kcal.trim();
        if (!name && !kcal) {
          continue;
        }
        if (!name) {
          errors[row.key] = "品名を入力してください。";
          continue;
        }
        const kcalProblem = draftKcalProblem(row.kcal);
        if (kcalProblem) {
          errors[row.key] = kcalProblem;
          continue;
        }
        lines.push({
          name,
          mealPeriod: period,
          mealSource: period === "間食" ? null : sources[period],
          kcal,
        });
      }
    }
    return { errors, lines };
  }

  async function estimate() {
    if (busy.current) {
      return;
    }
    const { errors, lines } = collectLines();
    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      setError(null);
      return;
    }
    setRowErrors({});
    const problem = bulkLineProblem(lines.map((line) => line.name));
    if (problem) {
      setError(problem);
      return;
    }
    busy.current = true;
    stopListening();
    setError(null);
    setReaction(null);
    setPhase("estimating");
    try {
      const result = await estimateBulkMeals({ date, lines });
      if (result.error) {
        setError(result.error);
        setPhase("edit");
        return;
      }
      setConfirmLines(
        result.lines.map((line) => {
          lineKey.current += 1;
          const enteredManually = line.kcalSource === "manual" && line.kcal !== null;
          return {
            key: `confirm-${lineKey.current}`,
            name: line.name,
            mealPeriod: line.mealPeriod,
            mealSource: line.mealSource,
            estimated: line.kcalSource === "ai" ? line.kcal : null,
            enteredManually,
            kcalText: line.kcal === null ? "" : String(line.kcal),
          };
        }),
      );
      setPhase("confirm");
    } catch {
      setError("通信に失敗しました。入力内容はそのままです。もう一度お試しください。");
      setPhase("edit");
    } finally {
      busy.current = false;
    }
  }

  async function confirmSave() {
    if (busy.current) {
      return;
    }
    if (confirmLines.length === 0) {
      setError("登録する品がありません。");
      return;
    }
    const invalid = confirmLines.some((line) => parseManualKcal(line.kcalText) === null);
    if (invalid) {
      setError("カロリーは0〜10000の整数で入力してください。");
      return;
    }
    busy.current = true;
    setError(null);
    setPhase("saving");
    try {
      const result = await saveBulkMeals({
        date,
        lines: confirmLines.map((line) => ({
          name: line.name,
          mealPeriod: line.mealPeriod,
          mealSource: line.mealSource,
          kcal: line.kcalText,
          kcalSource: kcalSourceFor(line),
        })),
      });
      if (result.error) {
        setError(result.error);
        setPhase("confirm");
        return;
      }
      setDrafts(emptyDrafts());
      setRowErrors({});
      setConfirmLines([]);
      setReaction(result.reaction);
      setPhase("edit");
    } catch {
      setError("通信に失敗しました。入力内容はそのままです。もう一度お試しください。");
      setPhase("confirm");
    } finally {
      busy.current = false;
    }
  }

  const confirmTotal = confirmLines.reduce((sum, line) => {
    const kcal = parseManualKcal(line.kcalText);
    return kcal === null ? sum : sum + kcal;
  }, 0);

  return (
    <div className="mt-6 min-w-0">
      <p className="text-xs leading-5 text-zinc-500">
        カロリーが分かるときは、kcalの欄に入れると、AIの推定を使わずにその数字を登録します
      </p>
      {speechOk === false ? (
        <p className="mt-2 text-xs leading-5 text-zinc-500">キーボードのマイクボタンでも音声入力できます</p>
      ) : null}
      {micError ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {micError}
        </p>
      ) : null}
      {phase === "confirm" || phase === "saving" ? (
        <ConfirmList
          lines={confirmLines}
          total={confirmTotal}
          pending={phase === "saving"}
          onChange={(key, kcalText) =>
            setConfirmLines((current) =>
              current.map((line) => (line.key === key ? { ...line, kcalText } : line)),
            )
          }
          onDelete={(key) => setConfirmLines((current) => current.filter((line) => line.key !== key))}
          onBack={() => {
            if (phase === "saving") {
              return;
            }
            setError(null);
            setPhase("edit");
          }}
          onSave={confirmSave}
        />
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-6">
            {shown.map((period) => (
              <PeriodField
                key={period}
                period={period}
                rows={drafts[period]}
                rowErrors={rowErrors}
                recordedKcal={periodTotal(meals, period)}
                recordedCount={meals.filter((meal) => meal.mealPeriod === period).length}
                source={period === "間食" ? null : sources[period]}
                onSource={(source) => {
                  if (period === "間食") {
                    return;
                  }
                  setSources((current) => ({ ...current, [period]: source }));
                }}
                onName={(key, name) => updateRow(period, key, { name })}
                onKcal={(key, kcal) => updateRow(period, key, { kcal })}
                onNameKeyDown={(index, event) => onNameKeyDown(period, index, event)}
                onNamePaste={(index, event) => onNamePaste(period, index, event)}
                onAdd={() => addRow(period)}
                onDelete={(key) => deleteRow(period, key)}
                speechOk={speechOk === true}
                listening={listening === period}
                onMic={() => toggleListening(period)}
                disabled={phase === "estimating"}
              />
            ))}
          </div>
          {hiddenLinks.length > 0 ? (
            <div className="mt-3 flex flex-col">
              {hiddenLinks.map((period) => (
                <button
                  key={period}
                  type="button"
                  className="inline-flex min-h-11 items-center self-start text-sm text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4"
                  disabled={phase === "estimating"}
                  onClick={() => setRevealed((current) => (current.includes(period) ? current : [...current, period]))}
                >
                  {period}も入力する
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className={`${primaryButton} mt-6`}
            disabled={phase === "estimating"}
            onClick={estimate}
          >
            {phase === "estimating" ? "推定中…" : "まとめて登録"}
          </button>
        </>
      )}
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <RecordReaction reaction={reaction} />
      )}
      <GuideLinks className="mt-3" newTab labelFor={(link) => DAY_GUIDE_LABELS[link.href] ?? link.label} />
    </div>
  );
}

function kcalSourceFor(line: ConfirmLine): KcalSource {
  if (line.enteredManually || line.estimated === null) {
    return "manual";
  }
  return line.kcalText.trim() === String(line.estimated) ? "ai" : "manual";
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 ${listening ? "animate-pulse text-red-600" : "text-[#F5821F]"}`}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
      />
    </svg>
  );
}

function PeriodField({
  period,
  rows,
  rowErrors,
  recordedKcal,
  recordedCount,
  source,
  onSource,
  onName,
  onKcal,
  onNameKeyDown,
  onNamePaste,
  onAdd,
  onDelete,
  speechOk,
  listening,
  onMic,
  disabled,
}: {
  period: MealPeriod;
  rows: DraftMealRow[];
  rowErrors: Record<string, string>;
  recordedKcal: number;
  recordedCount: number;
  source: MealSource | null;
  onSource: (source: MealSource) => void;
  onName: (key: string, name: string) => void;
  onKcal: (key: string, kcal: string) => void;
  onNameKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;
  onNamePaste: (index: number, event: ClipboardEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onDelete: (key: string) => void;
  speechOk: boolean;
  listening: boolean;
  onMic: () => void;
  disabled: boolean;
}) {
  const first = rows[0];
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-base font-medium text-zinc-950">
            {first ? <label htmlFor={`bulk-name-${first.key}`}>{period}</label> : period}
          </h2>
          {recordedCount > 0 ? (
            <span className={`text-xs text-zinc-500 ${kcalFigure}`}>登録済み {formatKcal(recordedKcal)}</span>
          ) : null}
        </div>
        {speechOk ? (
          <button
            type="button"
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border ${
              listening ? "border-red-500 bg-red-50" : "border-[#E4D7C6] bg-[#FBF6EE]"
            }`}
            aria-pressed={listening}
            aria-label={listening ? `${period}の音声入力を止める` : `${period}の音声入力を始める`}
            disabled={disabled}
            onClick={onMic}
          >
            <MicIcon listening={listening} />
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((row, index) => {
          const problem = rowErrors[row.key];
          return (
            <div key={row.key} className="min-w-0">
              <div className="flex min-w-0 flex-nowrap items-center gap-1">
                <input
                  id={`bulk-name-${row.key}`}
                  value={row.name}
                  onChange={(event) => onName(row.key, event.target.value)}
                  onKeyDown={(event) => onNameKeyDown(index, event)}
                  onPaste={(event) => onNamePaste(index, event)}
                  disabled={disabled}
                  placeholder="品名"
                  aria-label={`${period}の品名`}
                  enterKeyHint="next"
                  className={nameClass}
                />
                <input
                  value={row.kcal}
                  onChange={(event) => onKcal(row.key, event.target.value)}
                  disabled={disabled}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="kcal"
                  aria-label={`${period}のカロリー`}
                  aria-invalid={problem ? true : undefined}
                  className={kcalClass}
                />
                <button
                  type="button"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-xl leading-none text-zinc-500 hover:bg-[#E7DCC8] hover:text-zinc-800"
                  aria-label={`${period}の${index + 1}行目を削除`}
                  disabled={disabled}
                  onClick={() => onDelete(row.key)}
                >
                  ×
                </button>
              </div>
              {problem ? (
                <p className="mt-1 text-xs text-red-700" role="alert">
                  {problem}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-1 inline-flex min-h-11 items-center text-sm text-[#F5821F]"
        disabled={disabled}
        onClick={onAdd}
      >
        ＋ 1品追加
      </button>
      {period === "間食" ? null : (
        <div className="mt-3">
          <ExclusiveChecks
            name={`mealSource-${period}`}
            legend={`${period}の種類`}
            options={MEAL_SOURCES}
            value={source}
            onChange={onSource}
            disabled={disabled}
            idPrefix={`${period}-`}
          />
        </div>
      )}
    </section>
  );
}

function ConfirmList({
  lines,
  total,
  pending,
  onChange,
  onDelete,
  onBack,
  onSave,
}: {
  lines: ConfirmLine[];
  total: number;
  pending: boolean;
  onChange: (key: string, kcalText: string) => void;
  onDelete: (key: string) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <section className="mt-4">
      <h2 className="text-base font-medium text-zinc-950">登録内容の確認</h2>
      <p className={`mt-1 text-sm text-zinc-700 ${kcalFigure}`}>合計 {formatKcal(total)}</p>
      <ul className="mt-3">
        {lines.map((line) => {
          const source = kcalSourceFor(line);
          return (
            <li key={line.key} className="border-b border-[#F5821F]/20 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words text-sm text-zinc-950">{line.name}</p>
                <button
                  type="button"
                  className="inline-flex min-h-11 shrink-0 items-center px-3 text-sm text-red-700"
                  onClick={() => onDelete(line.key)}
                  disabled={pending}
                >
                  削除
                </button>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>
                  {line.mealPeriod}
                  {line.mealSource ? `・${line.mealSource}` : ""}
                </span>
                <span className="rounded-full bg-[#E6D9C8] px-2 py-0.5 text-[11px] text-[#6B5344]">
                  {kcalSourceLabel(source)}
                </span>
              </p>
              <label className="mt-2 flex min-w-0 items-center gap-2 text-sm text-zinc-700">
                <span className="shrink-0">kcal</span>
                <input
                  inputMode="numeric"
                  maxLength={5}
                  value={line.kcalText}
                  onChange={(event) => onChange(line.key, event.target.value)}
                  placeholder={line.estimated === null && !line.enteredManually ? "手入力してください" : undefined}
                  aria-label={`${line.name}のカロリー`}
                  className="h-12 w-28 min-w-0 rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-base outline-none focus:border-[#F5821F]"
                />
              </label>
              {line.estimated === null && !line.enteredManually ? (
                <p className="mt-1 text-xs text-zinc-600">手入力してください</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <button type="button" className={`${primaryButton} mt-4`} disabled={pending || lines.length === 0} onClick={onSave}>
        {pending ? "登録しています…" : "この内容で登録"}
      </button>
      <button
        type="button"
        className="mt-2 inline-flex min-h-11 items-center text-sm text-zinc-600 underline"
        onClick={onBack}
        disabled={pending}
      >
        入力に戻る
      </button>
    </section>
  );
}
