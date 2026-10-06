import {
  isActivityLevel,
  isGender,
  isPeriodUnit,
  type CaloriePlan,
  type GoalInput,
  type ProfileInput,
} from "./calorie-plan";
import { parseIsoDate } from "./calendar";
import { createDataClient } from "@/lib/supabase/server";
import { coerceStoredWeightAxis, type WeightAxisRange } from "./weight-axis";

export type StoredProfile = ProfileInput;

export type StoredCalorieGoal = GoalInput & CaloriePlan;

type ProfileRow = {
  height_cm: number | string;
  birth_date: string;
  gender: string;
  activity_level: string;
};

type CalorieGoalRow = {
  current_weight_kg: number | string;
  target_weight_kg: number | string;
  period_unit: string;
  period_count: number | string;
  period_days: number | string;
  bmr_kcal: number | string;
  tdee_kcal: number | string;
  daily_deficit_kcal: number | string;
  daily_kcal: number | string;
  weekly_kcal: number | string;
  floor_kcal: number | string;
  floor_applied: boolean;
};

function asNumber(value: number | string) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asInt(value: number | string) {
  const numeric = asNumber(value);
  if (numeric === null || !Number.isInteger(numeric)) {
    return null;
  }
  return numeric;
}

export function storageErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/schema cache|does not exist|Could not find the table/i.test(message)) {
    return "設定用のテーブルがありません。マイグレーションを適用してください。";
  }
  if (/is not set/.test(message)) {
    return "環境変数を設定してください。";
  }
  return fallback;
}

export async function getProfile(userId: string): Promise<StoredProfile | null> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("height_cm, birth_date, gender, activity_level")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  return mapProfile(data);
}

export async function upsertProfile(userId: string, profile: ProfileInput) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      height_cm: profile.heightCm,
      birth_date: profile.birthDate,
      gender: profile.gender,
      activity_level: profile.activityLevel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to save profile: ${error.message}`);
  }
}

export async function getCalorieGoal(userId: string): Promise<StoredCalorieGoal | null> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("calorie_goals")
    .select(
      "current_weight_kg, target_weight_kg, period_unit, period_count, period_days, bmr_kcal, tdee_kcal, daily_deficit_kcal, daily_kcal, weekly_kcal, floor_kcal, floor_applied",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load calorie goal: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  return mapCalorieGoal(data);
}

export async function upsertCalorieGoal(
  userId: string,
  input: GoalInput,
  plan: CaloriePlan,
) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("calorie_goals").upsert(
    {
      user_id: userId,
      current_weight_kg: input.currentWeightKg,
      target_weight_kg: input.targetWeightKg,
      period_unit: input.periodUnit,
      period_count: input.periodCount,
      period_days: plan.periodDays,
      bmr_kcal: plan.bmrKcal,
      tdee_kcal: plan.tdeeKcal,
      daily_deficit_kcal: plan.dailyDeficitKcal,
      daily_kcal: plan.dailyKcal,
      weekly_kcal: plan.weeklyKcal,
      floor_kcal: plan.floorKcal,
      floor_applied: plan.floorApplied,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to save calorie goal: ${error.message}`);
  }
}

function mapProfile(row: ProfileRow): StoredProfile | null {
  const heightCm = asNumber(row.height_cm);
  if (
    heightCm === null ||
    !parseIsoDate(row.birth_date) ||
    !isGender(row.gender) ||
    !isActivityLevel(row.activity_level)
  ) {
    return null;
  }

  return {
    heightCm,
    birthDate: row.birth_date,
    gender: row.gender,
    activityLevel: row.activity_level,
  };
}

function mapCalorieGoal(row: CalorieGoalRow): StoredCalorieGoal | null {
  const currentWeightKg = asNumber(row.current_weight_kg);
  const targetWeightKg = asNumber(row.target_weight_kg);
  const periodCount = asInt(row.period_count);
  const periodDays = asInt(row.period_days);
  const bmrKcal = asInt(row.bmr_kcal);
  const tdeeKcal = asInt(row.tdee_kcal);
  const dailyDeficitKcal = asInt(row.daily_deficit_kcal);
  const dailyKcal = asInt(row.daily_kcal);
  const weeklyKcal = asInt(row.weekly_kcal);
  const floorKcal = asInt(row.floor_kcal);
  if (
    currentWeightKg === null ||
    targetWeightKg === null ||
    periodCount === null ||
    periodDays === null ||
    bmrKcal === null ||
    tdeeKcal === null ||
    dailyDeficitKcal === null ||
    dailyKcal === null ||
    weeklyKcal === null ||
    floorKcal === null ||
    !isPeriodUnit(row.period_unit) ||
    weeklyKcal <= 0 ||
    dailyKcal <= 0
  ) {
    return null;
  }

  return {
    currentWeightKg,
    targetWeightKg,
    periodUnit: row.period_unit,
    periodCount,
    bmrKcal,
    tdeeKcal,
    periodDays,
    dailyDeficitKcal,
    dailyKcal,
    weeklyKcal,
    floorKcal,
    floorApplied: Boolean(row.floor_applied),
  };
}

function isMissingWeightAxisStorage(error: { message?: string; code?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /schema cache|does not exist|Could not find the table|Could not find the '.+' column/i.test(message)
  );
}

export async function getWeightAxis(userId: string): Promise<WeightAxisRange | null> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_axis_preferences")
    .select("min_kg, max_kg")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingWeightAxisStorage(error)) {
      return null;
    }
    throw new Error(`Failed to load weight axis: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  return coerceStoredWeightAxis(data.min_kg, data.max_kg);
}

export async function saveWeightAxis(userId: string, range: WeightAxisRange | null) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("weight_axis_preferences").upsert(
    {
      user_id: userId,
      min_kg: range ? range.minKg.toFixed(1) : null,
      max_kg: range ? range.maxKg.toFixed(1) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to save weight axis: ${error.message}`);
  }
}
