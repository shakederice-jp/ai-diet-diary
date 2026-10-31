"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { estimateBulkMeals, saveBulkMeals, type MealFormState } from "@/app/days/[date]/actions";
import { ExclusiveChecks } from "@/components/exclusive-checks";
import { GuideLinks } from "@/components/guide-links";
import { RecordReaction } from "@/components/record-reaction";
import {
  appendVoiceLine,
  bulkLineProblem,
  parseBulkLines,
  speechInputAvailable,
} from "@/lib/bulk-meals";
import { parseManualKcal } from "@/lib/manual-kcal";
import { formatKcal } from "@/lib/calendar";
import type { GuideLink } from "@/lib/guide-links";
import {
  MEAL_PERIODS,
  MEAL_SOURCES,
  bulkEntryPeriods,
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

const fieldClass =
  "mt-2 w-full min-w-0 resize-y rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-4 py-3 text-base leading-6 outline-none focus:border-[#F5821F] scroll-mb-40";
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
  kcalText: string;
};

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

export function MealEntryForm({
  date,
  meals,
}: {
  date: string;
  meals: Array<{ mealPeriod: MealPeriod; kcal: number }>;
}) {
  const clock = useSyncExternalStore(subscribeClock, readClock, () => serverClock);
  const speechOk = useSyncExternalStore(subscribeClock, browserSpeechAvailable, () => null as boolean | null);
  const [drafts, setDrafts] = useState<Record<MealPeriod, string>>({
    朝食: "",
    昼食: "",
    夕食: "",
    間食: "",
  });
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

  const basePeriods = clock ? bulkEntryPeriods(date, clock.today, clock.hour) : [...MEAL_PERIODS];
  const shown = MEAL_PERIODS.filter((period) => basePeriods.includes(period) || revealed.includes(period));
  const hiddenLinks = (["昼食", "夕食"] as const).filter((period) => !shown.includes(period));

  function setDraft(period: MealPeriod, value: string) {
    setDrafts((current) => ({ ...current, [period]: value }));
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
        setDrafts((current) => ({
          ...current,
          [period]: appendVoiceLine(current[period], transcript),
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

  function collectLines() {
    return shown.flatMap((period) =>
      parseBulkLines(drafts[period]).map((name) => ({
        name,
        mealPeriod: period,
        mealSource: period === "間食" ? null : sources[period],
      })),
    );
  }

  async function estimate() {
    if (busy.current) {
      return;
    }
    const lines = collectLines();
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
          return {
            key: `${lineKey.current}`,
            name: line.name,
            mealPeriod: line.mealPeriod,
            mealSource: line.mealSource,
            estimated: line.kcal,
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
      setDrafts({ 朝食: "", 昼食: "", 夕食: "", 間食: "" });
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
      {speechOk === false ? (
        <p className="text-xs leading-5 text-zinc-500">キーボードのマイクボタンでも音声入力できます</p>
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
          <div className="flex flex-col gap-6">
            {shown.map((period) => (
              <PeriodField
                key={period}
                period={period}
                value={drafts[period]}
                recordedKcal={periodTotal(meals, period)}
                recordedCount={meals.filter((meal) => meal.mealPeriod === period).length}
                source={period === "間食" ? null : sources[period]}
                onSource={(source) => {
                  if (period === "間食") {
                    return;
                  }
                  setSources((current) => ({ ...current, [period]: source }));
                }}
                onChange={(value) => setDraft(period, value)}
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
  if (line.estimated === null) {
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
  value,
  recordedKcal,
  recordedCount,
  source,
  onSource,
  onChange,
  speechOk,
  listening,
  onMic,
  disabled,
}: {
  period: MealPeriod;
  value: string;
  recordedKcal: number;
  recordedCount: number;
  source: MealSource | null;
  onSource: (source: MealSource) => void;
  onChange: (value: string) => void;
  speechOk: boolean;
  listening: boolean;
  onMic: () => void;
  disabled: boolean;
}) {
  const fieldId = `bulk-meal-${period}`;
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-base font-medium text-zinc-950">
            <label htmlFor={fieldId}>{period}</label>
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
      <textarea
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        disabled={disabled}
        placeholder="1行に1品。例: ご飯 / 味噌汁 / 焼き鮭"
        className={fieldClass}
      />
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
    <section>
      <h2 className="text-base font-medium text-zinc-950">登録内容の確認</h2>
      <p className={`mt-1 text-sm text-zinc-700 ${kcalFigure}`}>合計 {formatKcal(total)}</p>
      <ul className="mt-3">
        {lines.map((line) => (
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
            <p className="mt-1 text-xs text-zinc-500">
              {line.mealPeriod}
              {line.mealSource ? `・${line.mealSource}` : ""}
            </p>
            <label className="mt-2 flex min-w-0 items-center gap-2 text-sm text-zinc-700">
              <span className="shrink-0">kcal</span>
              <input
                inputMode="numeric"
                maxLength={5}
                value={line.kcalText}
                onChange={(event) => onChange(line.key, event.target.value)}
                placeholder={line.estimated === null ? "手入力してください" : undefined}
                aria-label={`${line.name}のカロリー`}
                className="h-12 w-28 min-w-0 rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-base outline-none focus:border-[#F5821F]"
              />
            </label>
            {line.estimated === null ? (
              <p className="mt-1 text-xs text-zinc-600">手入力してください</p>
            ) : null}
          </li>
        ))}
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
