"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { parseIsoDate } from "@/lib/calendar";
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
  ensureDefaultCategories,
  getFavorite,
  insertMeal,
  listMeals,
  moveFavorite,
  renameCategory,
  upsertFavorite,
} from "@/lib/meals";
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
}

function failureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "記録に失敗しました";
  if (message.includes("ANTHROPIC_API_KEY") || message.includes("HEALTHPLANET_CLIENT_SECRET")) {
    return "APIキーの環境変数を設定してください。";
  }
  if (/meal_records|menu_categories|favorite_menus|meal_period|meal_source/.test(message)) {
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
  const mealPeriod = parseMealPeriod(String(formData.get("mealPeriod") ?? ""));
  if (!mealPeriod) {
    return { error: "時間帯を1つ選んでください。", savedAt: null };
  }
  const mealSource =
    mealPeriod === "間食" ? null : parseMealSource(String(formData.get("mealSource") ?? ""));
  if (mealPeriod !== "間食" && !mealSource) {
    return { error: "外食・内食・中食のいずれかを選んでください。", savedAt: null };
  }

  try {
    const userId = await ensureUserId();
    const kcal = await estimateDishKcal(name);
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

    await insertMeal({ userId, date, name, kcal, favoriteId, mealPeriod, mealSource });
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
      });
    }
  } else {
    await deleteFavoriteMealsOnDate(userId, date, favoriteId);
  }

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
