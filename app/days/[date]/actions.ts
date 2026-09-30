"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { parseManualKcal } from "@/lib/calories";
import { parseIsoDate } from "@/lib/calendar";
import { syncDayEngagement } from "@/lib/engagement";
import {
  mealPeriodForTokyoHour,
  parseMealPeriod,
  parseMealSource,
  tokyoHour,
} from "@/lib/meal-slot";
import { classifyDishCategory, estimateDishKcal } from "@/lib/claude";
import { getHealthPlanetClientSecret } from "@/lib/env";
import {
  addCategory,
  deleteFavoriteMealsOnDate,
  deleteMeal,
  ensureDefaultCategories,
  getFavorite,
  getMeal,
  insertMeal,
  listMeals,
  moveFavorite,
  renameCategory,
  updateMeal,
  upsertFavorite,
} from "@/lib/meals";
import {
  parseTokyoDateTimeLocal,
  parseWeightKg,
  tokyoDateFromInstant,
} from "@/lib/weight-format";
import {
  deleteManualWeight,
  insertManualWeight,
  updateManualWeight,
} from "@/lib/weights";
import {
  USER_COOKIE,
  signedValue,
  userCookieOptions,
  verifySignedValue,
} from "@/lib/session";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MealFormState = {
  error: string | null;
  savedAt: number | null;
};

async function ensureUserId() {
  const store = await cookies();
  const secret = getHealthPlanetClientSecret();
  const existing = store.get(USER_COOKIE)?.value;
  const current = existing ? verifySignedValue(existing, secret) : null;
  if (current) {
    return current;
  }

  const userId = crypto.randomUUID();
  store.set(USER_COOKIE, signedValue(userId, secret), userCookieOptions());
  return userId;
}

function refreshDay(date: string) {
  revalidatePath(`/days/${date}`);
  revalidatePath("/");
  revalidatePath("/mypage");
}

async function rememberEngagement(userId: string, date: string) {
  try {
    await syncDayEngagement(userId, date);
  } catch {
    // The meal or weight row is already saved. The panel reports a missing table.
  }
}

function failureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "記録に失敗しました";
  if (message.includes("ANTHROPIC_API_KEY") || message.includes("HEALTHPLANET_CLIENT_SECRET")) {
    return "APIキーの環境変数を設定してください。";
  }
  if (/weight_records/.test(message)) {
    return "体重のテーブルがありません。マイグレーションを適用してください。";
  }
  if (/meal_records|menu_categories|favorite_menus|meal_period|meal_source|kcal_source/.test(message)) {
    return "食事記録のテーブルがありません。マイグレーションを適用してください。";
  }
  return message.length > 180 ? `${message.slice(0, 180)}…` : message;
}

function readDate(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  return parseIsoDate(date) ? date : null;
}

function readName(formData: FormData, field: string, maxLength: number) {
  return String(formData.get(field) ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function readMealChoice(formData: FormData) {
  const mealPeriod = parseMealPeriod(String(formData.get("mealPeriod") ?? ""));
  if (!mealPeriod) {
    return { error: "時間帯を1つ選んでください。" as const };
  }
  const mealSource =
    mealPeriod === "間食" ? null : parseMealSource(String(formData.get("mealSource") ?? ""));
  if (mealPeriod !== "間食" && !mealSource) {
    return { error: "外食・内食・中食のいずれかを選んでください。" as const };
  }
  return { mealPeriod, mealSource };
}

function refreshMeasuredDay(pageDate: string, measuredAt: string) {
  refreshDay(pageDate);
  const measuredDate = tokyoDateFromInstant(measuredAt);
  if (measuredDate && measuredDate !== pageDate) {
    refreshDay(measuredDate);
  }
}

export async function addMeal(
  _previous: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const date = readDate(formData);
  const name = readName(formData, "name", 80);
  if (!date) {
    return { error: "日付が不正です。", savedAt: null };
  }
  if (!name) {
    return { error: "料理名を入力してください。", savedAt: null };
  }
  const choice = readMealChoice(formData);
  if ("error" in choice && choice.error) {
    return { error: choice.error, savedAt: null };
  }
  const rawKcal = String(formData.get("kcal") ?? "").trim();
  const manualKcal = rawKcal === "" ? null : parseManualKcal(rawKcal);
  if (rawKcal !== "" && manualKcal === null) {
    return { error: "カロリーは0〜10000の整数で入力してください。", savedAt: null };
  }

  try {
    const userId = await ensureUserId();
    const kcal = manualKcal ?? (await estimateDishKcal(name));
    const kcalSource = manualKcal === null ? "ai" : "manual";
    let favoriteId: string | null = null;

    if (formData.get("saveFavorite") === "on") {
      const categories = await ensureDefaultCategories(userId);
      const names = categories.map((category) => category.name);
      const classified = await classifyDishCategory(name, names);
      const category =
        categories.find((item) => item.name === classified) ??
        categories.find((item) => item.name === "その他") ??
        categories[0];
      if (!category) {
        throw new Error("カテゴリーを用意できませんでした。");
      }
      favoriteId = await upsertFavorite({
        userId,
        name,
        kcal,
        categoryId: category.id,
      });
    }

    await insertMeal({
      userId,
      date,
      name,
      kcal,
      favoriteId,
      mealPeriod: choice.mealPeriod,
      mealSource: choice.mealSource,
      kcalSource,
    });
    await rememberEngagement(userId, date);
    refreshDay(date);
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: failureMessage(error), savedAt: null };
  }
}

export async function setFavoriteOnDay(date: string, favoriteId: string, checked: boolean) {
  if (!parseIsoDate(date) || !UUID_PATTERN.test(favoriteId)) {
    return;
  }

  const userId = await ensureUserId();
  const favorite = await getFavorite(userId, favoriteId);
  if (!favorite) {
    return;
  }

  if (checked) {
    const meals = await listMeals(userId, date);
    const alreadyLogged = meals.some((meal) => meal.favoriteId === favoriteId);
    if (!alreadyLogged) {
      const mealPeriod = mealPeriodForTokyoHour(tokyoHour());
      await insertMeal({
        userId,
        date,
        name: favorite.name,
        kcal: favorite.kcal,
        favoriteId,
        mealPeriod,
        mealSource: mealPeriod === "間食" ? null : "内食",
        kcalSource: "ai",
      });
    }
  } else {
    await deleteFavoriteMealsOnDate(userId, date, favoriteId);
  }

  await rememberEngagement(userId, date);
  refreshDay(date);
}

export async function createCategory(formData: FormData) {
  const date = readDate(formData);
  const name = readName(formData, "name", 20);
  if (!date || !name) {
    return;
  }

  const userId = await ensureUserId();
  await ensureDefaultCategories(userId);
  await addCategory(userId, name);
  refreshDay(date);
}

export async function updateCategoryName(formData: FormData) {
  const date = readDate(formData);
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = readName(formData, "name", 20);
  if (!date || !UUID_PATTERN.test(categoryId) || !name) {
    return;
  }

  const userId = await ensureUserId();
  await renameCategory(userId, categoryId, name);
  refreshDay(date);
}

export async function updateFavoriteCategory(formData: FormData) {
  const date = readDate(formData);
  const favoriteId = String(formData.get("favoriteId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!date || !UUID_PATTERN.test(favoriteId) || !UUID_PATTERN.test(categoryId)) {
    return;
  }

  const userId = await ensureUserId();
  await moveFavorite(userId, favoriteId, categoryId);
  refreshDay(date);
}

export async function updateMealRecord(
  _previous: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const date = readDate(formData);
  const id = String(formData.get("id") ?? "");
  const name = readName(formData, "name", 80);
  const kcal = parseManualKcal(String(formData.get("kcal") ?? ""));
  if (!date || !UUID_PATTERN.test(id)) {
    return { error: "記録が見つかりません。", savedAt: null };
  }
  if (!name) {
    return { error: "料理名を入力してください。", savedAt: null };
  }
  if (kcal === null) {
    return { error: "カロリーは0〜10000の整数で入力してください。", savedAt: null };
  }
  const choice = readMealChoice(formData);
  if ("error" in choice && choice.error) {
    return { error: choice.error, savedAt: null };
  }

  try {
    const userId = await ensureUserId();
    const existing = await getMeal(userId, id);
    if (!existing || existing.recordedOn !== date) {
      return { error: "記録が見つかりません。", savedAt: null };
    }
    await updateMeal({
      userId,
      id,
      name,
      kcal,
      mealPeriod: choice.mealPeriod,
      mealSource: choice.mealSource,
      kcalSource: kcal === existing.kcal ? existing.kcalSource : "manual",
    });
    refreshDay(date);
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: failureMessage(error), savedAt: null };
  }
}

export async function deleteMealRecord(
  _previous: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const date = readDate(formData);
  const id = String(formData.get("id") ?? "");
  if (!date || !UUID_PATTERN.test(id)) {
    return { error: "記録が見つかりません。", savedAt: null };
  }

  try {
    const userId = await ensureUserId();
    const existing = await getMeal(userId, id);
    if (!existing || existing.recordedOn !== date) {
      return { error: "記録が見つかりません。", savedAt: null };
    }
    await deleteMeal(userId, id);
    await rememberEngagement(userId, date);
    refreshDay(date);
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: failureMessage(error), savedAt: null };
  }
}

function readWeightFields(formData: FormData) {
  const date = readDate(formData);
  const weightKg = parseWeightKg(String(formData.get("weightKg") ?? ""));
  const measuredAt = parseTokyoDateTimeLocal(String(formData.get("measuredAt") ?? ""));
  if (!date) {
    return { error: "日付が不正です。" as const };
  }
  if (weightKg === null) {
    return { error: "体重は20〜300kgで、小数第1位まで入力してください。" as const };
  }
  if (!measuredAt) {
    return { error: "測定日時が不正です。" as const };
  }
  return { date, weightKg, measuredAt };
}

export async function addWeight(
  _previous: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const fields = readWeightFields(formData);
  if ("error" in fields && fields.error) {
    return { error: fields.error, savedAt: null };
  }

  try {
    const userId = await ensureUserId();
    await insertManualWeight({
      userId,
      measuredAt: fields.measuredAt,
      weightKg: fields.weightKg,
    });
    await rememberEngagement(userId, tokyoDateFromInstant(fields.measuredAt) ?? fields.date);
    refreshMeasuredDay(fields.date, fields.measuredAt);
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: failureMessage(error), savedAt: null };
  }
}

export async function updateWeightRecord(
  _previous: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const id = String(formData.get("id") ?? "");
  const fields = readWeightFields(formData);
  if (!UUID_PATTERN.test(id)) {
    return { error: "記録が見つかりません。", savedAt: null };
  }
  if ("error" in fields && fields.error) {
    return { error: fields.error, savedAt: null };
  }

  try {
    const userId = await ensureUserId();
    await updateManualWeight({
      userId,
      id,
      measuredAt: fields.measuredAt,
      weightKg: fields.weightKg,
    });
    await rememberEngagement(userId, fields.date);
    const measuredDate = tokyoDateFromInstant(fields.measuredAt);
    if (measuredDate && measuredDate !== fields.date) {
      await rememberEngagement(userId, measuredDate);
    }
    refreshMeasuredDay(fields.date, fields.measuredAt);
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: failureMessage(error), savedAt: null };
  }
}

export async function deleteWeightRecord(
  _previous: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const date = readDate(formData);
  const id = String(formData.get("id") ?? "");
  if (!date || !UUID_PATTERN.test(id)) {
    return { error: "記録が見つかりません。", savedAt: null };
  }

  try {
    const userId = await ensureUserId();
    await deleteManualWeight(userId, id);
    await rememberEngagement(userId, date);
    refreshDay(date);
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: failureMessage(error), savedAt: null };
  }
}
