"use client";

import { useActionState, useMemo, useState } from "react";
import { saveProfile, type ProfileFormState } from "@/app/settings/actions";
import { ChoiceField } from "@/components/choice-field";
import { parseIsoDate } from "@/lib/calendar";
import {
  ACTIVITY_OPTIONS,
  GENDER_OPTIONS,
  birthYearOptions,
  daysInMonth,
  type ActivityLevel,
  type Gender,
} from "@/lib/calorie-plan";

const initialState: ProfileFormState = { error: null, savedAt: null };
const fieldClass =
  "h-12 w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-sm outline-none focus:border-[#F5821F]";
const selectClass =
  "min-h-[52px] w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-2 text-base outline-none focus:border-[#F5821F]";

function splitBirthDate(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return { year: "", month: "", day: "" };
  }
  return {
    year: String(parsed.year),
    month: String(parsed.month),
    day: String(parsed.day),
  };
}

function selectableDayCount(year: string, month: string) {
  if (!month) {
    return 31;
  }
  const monthNumber = Number(month);
  if (!year) {
    return daysInMonth(2000, monthNumber);
  }
  return daysInMonth(Number(year), monthNumber);
}

function birthDateValue(year: string, month: string, day: string) {
  if (!year || !month || !day) {
    return "";
  }
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1) {
    return "";
  }
  if (dayNumber > daysInMonth(yearNumber, monthNumber)) {
    return "";
  }
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

export function ProfileForm({
  initial,
  todayYear,
}: {
  initial: {
    heightCm: string;
    birthDate: string;
    gender: Gender | "";
    activityLevel: ActivityLevel | "";
  };
  todayYear: number;
}) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);
  const [gender, setGender] = useState<Gender | "">(initial.gender);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">(initial.activityLevel);
  const saved = splitBirthDate(initial.birthDate);
  const [year, setYear] = useState(saved.year);
  const [month, setMonth] = useState(saved.month);
  const [day, setDay] = useState(saved.day);

  const years = useMemo(() => {
    const options = birthYearOptions(todayYear);
    const savedYear = Number(year);
    if (year && !options.includes(savedYear)) {
      return [savedYear, ...options];
    }
    return options;
  }, [todayYear, year]);

  const dayCount = selectableDayCount(year, month);
  const birthDate = birthDateValue(year, month, day);

  function chooseMonth(nextMonth: string) {
    setMonth(nextMonth);
    if (day && Number(day) > selectableDayCount(year, nextMonth)) {
      setDay("");
    }
  }

  function chooseYear(nextYear: string) {
    setYear(nextYear);
    if (day && Number(day) > selectableDayCount(nextYear, month)) {
      setDay("");
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-950">
        身長 (cm)
        <input
          name="heightCm"
          required
          inputMode="decimal"
          min={100}
          max={250}
          step={0.1}
          defaultValue={initial.heightCm}
          placeholder="例: 170.0"
          aria-label="身長 (cm)"
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-zinc-950">生年月日</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          <select
            aria-label="年"
            value={year}
            onChange={(event) => chooseYear(event.target.value)}
            className={selectClass}
          >
            <option value="">年を選択</option>
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            aria-label="月"
            value={month}
            onChange={(event) => chooseMonth(event.target.value)}
            className={selectClass}
          >
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            aria-label="日"
            value={day}
            onChange={(event) => setDay(event.target.value)}
            className={selectClass}
          >
            <option value="">日</option>
            {Array.from({ length: dayCount }, (_, index) => index + 1).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="birthDate" value={birthDate} />
      </fieldset>

      <ChoiceField
        name="gender"
        legend="性別"
        value={gender}
        options={GENDER_OPTIONS}
        onChange={setGender}
      />

      <ChoiceField
        name="activityLevel"
        legend="活動量"
        value={activityLevel}
        options={ACTIVITY_OPTIONS}
        onChange={setActivityLevel}
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C] disabled:brightness-90 sm:w-auto"
      >
        {pending ? "保存しています…" : "保存する"}
      </button>

      <div aria-live="polite">
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        {state.savedAt ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            保存しました。目標設定で摂取カロリーの目安を計算できます。
          </p>
        ) : null}
      </div>
    </form>
  );
}
