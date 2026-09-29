"use server";

import { revalidatePath } from "next/cache";
import {
  ageOnDate,
  calculateCaloriePlan,
  parseGoalInput,
} from "@/lib/calorie-plan";
import { tokyoToday } from "@/lib/calendar";
import { ensureUserIdFromCookies } from "@/lib/session";
import {
  getProfile,
  storageErrorMessage,
  upsertCalorieGoal,
} from "@/lib/user-settings";

export type GoalFormState = {
  error: string | null;
  savedAt: number | null;
};

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveGoal(
  _state: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  try {
    const userId = await ensureUserIdFromCookies();
    const profile = await getProfile(userId);
    if (!profile) {
      return {
        error: "先にプロフィール（身長・生年月日・性別・活動量）を保存してください。",
        savedAt: null,
      };
    }

    const parsed = parseGoalInput({
      currentWeightKg: readText(formData, "currentWeightKg"),
      targetWeightKg: readText(formData, "targetWeightKg"),
      periodUnit: readText(formData, "periodUnit"),
      periodCount: readText(formData, "periodCount"),
    });
    if (!parsed.ok) {
      return { error: parsed.error, savedAt: null };
    }

    const today = tokyoToday();
    const ageYears = ageOnDate(profile.birthDate, today);
    if (ageYears === null) {
      return { error: "プロフィールの生年月日を確認してください。", savedAt: null };
    }

    const plan = calculateCaloriePlan({
      gender: profile.gender,
      heightCm: profile.heightCm,
      ageYears,
      activityLevel: profile.activityLevel,
      currentWeightKg: parsed.value.currentWeightKg,
      targetWeightKg: parsed.value.targetWeightKg,
      periodUnit: parsed.value.periodUnit,
      periodCount: parsed.value.periodCount,
      today,
    });

    await upsertCalorieGoal(userId, parsed.value, plan);
    revalidatePath("/", "layout");
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: storageErrorMessage(error, "保存に失敗しました。"), savedAt: null };
  }
}
