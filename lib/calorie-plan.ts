import { parseIsoDate } from "./calendar";

export const KCAL_PER_KG = 7_000;

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.55,
  active: 1.725,
} as const;

export const CALORIE_FLOORS = {
  female: 1_200,
  male: 1_500,
  unspecified: 1_500,
} as const;

const REVISED_HARRIS_BENEDICT = {
  male: { constant: 88.362, weight: 13.397, height: 4.799, age: 5.677 },
  female: { constant: 447.593, weight: 9.247, height: 3.098, age: 4.33 },
} as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "unspecified", label: "回答しない" },
] as const;

export const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "デスクワーク中心" },
  { value: "light", label: "立ち仕事や軽い運動あり" },
  { value: "active", label: "よく運動する" },
] as const;

export const PERIOD_OPTIONS = [
  { value: "weeks", label: "週数" },
  { value: "months", label: "か月後" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];
export type ActivityLevel = (typeof ACTIVITY_OPTIONS)[number]["value"];
export type PeriodUnit = (typeof PERIOD_OPTIONS)[number]["value"];

export type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

export type ProfileInput = {
  heightCm: number;
  birthDate: string;
  gender: Gender;
  activityLevel: ActivityLevel;
};

export type GoalInput = {
  currentWeightKg: number;
  targetWeightKg: number;
  periodUnit: PeriodUnit;
  periodCount: number;
};

export type CaloriePlan = {
  bmrKcal: number;
  tdeeKcal: number;
  periodDays: number;
  dailyDeficitKcal: number;
  dailyKcal: number;
  weeklyKcal: number;
  floorKcal: number;
  floorApplied: boolean;
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const MIN_AGE = 15;
const MAX_AGE = 100;
const MIN_WEEKS = 1;
const MAX_WEEKS = 104;
const MIN_MONTHS = 1;
const MAX_MONTHS = 36;

export function isGender(value: string): value is Gender {
  return GENDER_OPTIONS.some((option) => option.value === value);
}

export function isActivityLevel(value: string): value is ActivityLevel {
  return ACTIVITY_OPTIONS.some((option) => option.value === value);
}

export function isPeriodUnit(value: string): value is PeriodUnit {
  return value === "weeks" || value === "months";
}

export function isoYearsBefore(today: CalendarDay, years: number) {
  const year = today.year - years;
  const lastDay = new Date(Date.UTC(year, today.month, 0)).getUTCDate();
  const day = Math.min(today.day, lastDay);
  return `${year}-${String(today.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function ageOnDate(birthDate: string, today: CalendarDay) {
  const birth = parseIsoDate(birthDate);
  if (!birth) {
    return null;
  }

  let age = today.year - birth.year;
  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) {
    age -= 1;
  }
  return age;
}

function harrisBenedict(sex: "male" | "female", weightKg: number, heightCm: number, ageYears: number) {
  const terms = REVISED_HARRIS_BENEDICT[sex];
  return (
    terms.constant + terms.weight * weightKg + terms.height * heightCm - terms.age * ageYears
  );
}

export function revisedHarrisBenedictBmr(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  ageYears: number,
) {
  const male = harrisBenedict("male", weightKg, heightCm, ageYears);
  const female = harrisBenedict("female", weightKg, heightCm, ageYears);
  if (gender === "male") {
    return male;
  }
  if (gender === "female") {
    return female;
  }
  return (male + female) / 2;
}

export function addCalendarMonths(today: CalendarDay, months: number): CalendarDay {
  const monthIndex = today.month - 1 + months;
  const year = today.year + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, day: Math.min(today.day, lastDay) };
}

export function periodLengthDays(unit: PeriodUnit, count: number, today: CalendarDay) {
  if (unit === "weeks") {
    return count * 7;
  }

  const end = addCalendarMonths(today, count);
  const startUtc = Date.UTC(today.year, today.month - 1, today.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function calculateCaloriePlan(input: {
  gender: Gender;
  heightCm: number;
  ageYears: number;
  activityLevel: ActivityLevel;
  currentWeightKg: number;
  targetWeightKg: number;
  periodUnit: PeriodUnit;
  periodCount: number;
  today: CalendarDay;
}): CaloriePlan {
  const bmr = revisedHarrisBenedictBmr(
    input.gender,
    input.currentWeightKg,
    input.heightCm,
    input.ageYears,
  );
  const tdee = bmr * ACTIVITY_FACTORS[input.activityLevel];
  const periodDays = periodLengthDays(input.periodUnit, input.periodCount, input.today);
  const dailyDeficit =
    ((input.currentWeightKg - input.targetWeightKg) * KCAL_PER_KG) / periodDays;
  const rawDaily = tdee - dailyDeficit;
  const floorKcal = CALORIE_FLOORS[input.gender];
  const floorApplied = rawDaily < floorKcal;
  const dailyKcal = Math.round(Math.max(rawDaily, floorKcal));

  return {
    bmrKcal: Math.round(bmr),
    tdeeKcal: Math.round(tdee),
    periodDays,
    dailyDeficitKcal: Math.round(dailyDeficit),
    dailyKcal,
    weeklyKcal: dailyKcal * 7,
    floorKcal,
    floorApplied,
  };
}

export function planGapLabel(dailyDeficitKcal: number) {
  if (dailyDeficitKcal > 0) {
    return "1日あたりの目標赤字";
  }
  if (dailyDeficitKcal < 0) {
    return "1日あたりの目標黒字";
  }
  return "1日あたりの増減";
}

export function planPeriodLabel(unit: PeriodUnit, count: number, days: number) {
  const span = unit === "weeks" ? `${count}週` : `${count}か月後`;
  return `${span}（${days}日）`;
}

function invalid(error: string): ParseResult<never> {
  return { ok: false, error };
}

function parseOneDecimal(value: string, min: number, max: number) {
  const trimmed = value.trim();
  if (!/^\d{1,3}(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const rounded = Math.round(Number(trimmed) * 10) / 10;
  if (rounded < min || rounded > max) {
    return null;
  }
  return rounded;
}

export function parseProfileInput(input: {
  heightCm: string;
  birthDate: string;
  gender: string;
  activityLevel: string;
  today: CalendarDay;
}): ParseResult<ProfileInput> {
  if (!input.heightCm.trim()) {
    return invalid("身長を入力してください。");
  }
  const heightCm = parseOneDecimal(input.heightCm, 100, 250);
  if (heightCm === null) {
    return invalid("身長は100〜250cmで入力してください。");
  }

  if (!input.birthDate.trim()) {
    return invalid("生年月日を入力してください。");
  }
  if (!parseIsoDate(input.birthDate.trim())) {
    return invalid("生年月日の形式が正しくありません。");
  }
  const age = ageOnDate(input.birthDate.trim(), input.today);
  if (age === null || age < MIN_AGE || age > MAX_AGE) {
    return invalid("15歳から100歳までの生年月日を入力してください。");
  }

  if (!input.gender) {
    return invalid("性別を選択してください。");
  }
  if (!isGender(input.gender)) {
    return invalid("性別の選択が正しくありません。");
  }

  if (!input.activityLevel) {
    return invalid("活動量を選択してください。");
  }
  if (!isActivityLevel(input.activityLevel)) {
    return invalid("活動量の選択が正しくありません。");
  }

  return {
    ok: true,
    value: {
      heightCm,
      birthDate: input.birthDate.trim(),
      gender: input.gender,
      activityLevel: input.activityLevel,
    },
  };
}

export function parseGoalInput(input: {
  currentWeightKg: string;
  targetWeightKg: string;
  periodUnit: string;
  periodCount: string;
}): ParseResult<GoalInput> {
  if (!input.currentWeightKg.trim()) {
    return invalid("現在の体重を入力してください。");
  }
  const currentWeightKg = parseOneDecimal(input.currentWeightKg, 20, 300);
  if (currentWeightKg === null) {
    return invalid("現在の体重は20〜300kgで入力してください。");
  }

  if (!input.targetWeightKg.trim()) {
    return invalid("目標体重を入力してください。");
  }
  const targetWeightKg = parseOneDecimal(input.targetWeightKg, 20, 300);
  if (targetWeightKg === null) {
    return invalid("目標体重は20〜300kgで入力してください。");
  }

  if (!isPeriodUnit(input.periodUnit)) {
    return invalid("期間の単位を選択してください。");
  }

  const max = input.periodUnit === "weeks" ? MAX_WEEKS : MAX_MONTHS;
  const min = input.periodUnit === "weeks" ? MIN_WEEKS : MIN_MONTHS;
  if (!/^\d{1,3}$/.test(input.periodCount.trim())) {
    return invalid(
      input.periodUnit === "weeks"
        ? "期間は1〜104週で入力してください。"
        : "期間は1〜36か月で入力してください。",
    );
  }
  const periodCount = Number(input.periodCount.trim());
  if (periodCount < min || periodCount > max) {
    return invalid(
      input.periodUnit === "weeks"
        ? "期間は1〜104週で入力してください。"
        : "期間は1〜36か月で入力してください。",
    );
  }

  return {
    ok: true,
    value: {
      currentWeightKg,
      targetWeightKg,
      periodUnit: input.periodUnit,
      periodCount,
    },
  };
}

export function decimalInputValue(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
