import { weekBounds, type WeekStart } from "@/lib/calendar";
import type { KcalSource, MealPeriod, MealSource } from "@/lib/meal-slot";
import { createDataClient } from "@/lib/supabase/server";

export const DEFAULT_MENU_CATEGORIES = [
  "和食",
  "中華",
  "イタリアン",
  "丼",
  "間食",
  "麺類",
  "その他",
] as const;

export type MealEntry = {
  id: string;
  name: string;
  kcal: number;
  favoriteId: string | null;
  mealPeriod: MealPeriod;
  mealSource: MealSource | null;
  kcalSource: KcalSource;
};

export type MenuCategory = {
  id: string;
  name: string;
};

export type FavoriteMenu = {
  id: string;
  name: string;
  kcal: number;
  categoryId: string;
};

type MealRow = {
  id: string;
  name: string;
  kcal: number;
  favorite_id: string | null;
  meal_period: MealPeriod;
  meal_source: MealSource | null;
  kcal_source: KcalSource | null;
  recorded_on?: string;
};

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type FavoriteRow = {
  id: string;
  name: string;
  kcal: number;
  category_id: string;
};

function mapMeal(row: MealRow): MealEntry {
  return {
    id: row.id,
    name: row.name,
    kcal: row.kcal,
    favoriteId: row.favorite_id,
    mealPeriod: row.meal_period,
    mealSource: row.meal_source,
    kcalSource: row.kcal_source === "manual" ? "manual" : "ai",
  };
}

export async function listMeals(userId: string, date: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("meal_records")
    .select("id, name, kcal, favorite_id, meal_period, meal_source, kcal_source")
    .eq("user_id", userId)
    .eq("recorded_on", date)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load meals: ${error.message}`);
  }

  return ((data ?? []) as MealRow[]).map(mapMeal);
}

export async function listMealKcalBetween(userId: string, start: string, end: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("meal_records")
    .select("recorded_on, kcal")
    .eq("user_id", userId)
    .gte("recorded_on", start)
    .lte("recorded_on", end);

  if (error) {
    throw new Error(`Failed to load meal calories: ${error.message}`);
  }

  return (data ?? []) as Array<{ recorded_on: string; kcal: number }>;
}

export async function getMeal(userId: string, id: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("meal_records")
    .select("id, name, kcal, favorite_id, meal_period, meal_source, kcal_source, recorded_on")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load meal: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const row = data as MealRow;
  return {
    ...mapMeal(row),
    recordedOn: row.recorded_on ?? "",
  };
}

export async function insertMeal(input: {
  userId: string;
  date: string;
  name: string;
  kcal: number;
  favoriteId: string | null;
  mealPeriod: MealPeriod;
  mealSource: MealSource | null;
  kcalSource: KcalSource;
}) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("meal_records").insert({
    user_id: input.userId,
    recorded_on: input.date,
    name: input.name,
    kcal: input.kcal,
    favorite_id: input.favoriteId,
    meal_period: input.mealPeriod,
    meal_source: input.mealPeriod === "間食" ? null : input.mealSource,
    kcal_source: input.kcalSource,
  });

  if (error) {
    throw new Error(`Failed to save meal: ${error.message}`);
  }
}

export async function updateMeal(input: {
  userId: string;
  id: string;
  name: string;
  kcal: number;
  mealPeriod: MealPeriod;
  mealSource: MealSource | null;
  kcalSource: KcalSource;
}) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("meal_records")
    .update({
      name: input.name,
      kcal: input.kcal,
      meal_period: input.mealPeriod,
      meal_source: input.mealPeriod === "間食" ? null : input.mealSource,
      kcal_source: input.kcalSource,
    })
    .eq("user_id", input.userId)
    .eq("id", input.id)
    .select("id");

  if (error) {
    throw new Error(`Failed to update meal: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("記録が見つかりません。");
  }
}

export async function deleteMeal(userId: string, id: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("meal_records")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(`Failed to delete meal: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("記録が見つかりません。");
  }
}

export async function deleteFavoriteMealsOnDate(
  userId: string,
  date: string,
  favoriteId: string,
) {
  const supabase = await createDataClient();
  const { error } = await supabase
    .from("meal_records")
    .delete()
    .eq("user_id", userId)
    .eq("recorded_on", date)
    .eq("favorite_id", favoriteId);

  if (error) {
    throw new Error(`Failed to remove favorite meal: ${error.message}`);
  }
}

export async function listCategories(userId: string): Promise<MenuCategory[]> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, name, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return ((data ?? []) as CategoryRow[]).map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

export async function ensureDefaultCategories(userId: string) {
  const existing = await listCategories(userId);
  if (existing.length > 0) {
    return existing;
  }

  const supabase = await createDataClient();
  const { error } = await supabase.from("menu_categories").insert(
    DEFAULT_MENU_CATEGORIES.map((name, index) => ({
      user_id: userId,
      name,
      sort_order: index,
    })),
  );

  if (error) {
    const created = await listCategories(userId);
    if (created.length > 0) {
      return created;
    }
    throw new Error(`Failed to prepare categories: ${error.message}`);
  }

  return listCategories(userId);
}

export async function addCategory(userId: string, name: string) {
  const existing = await listCategories(userId);
  const supabase = await createDataClient();
  const { error } = await supabase.from("menu_categories").insert({
    user_id: userId,
    name,
    sort_order: existing.length,
  });

  if (error) {
    throw new Error(`Failed to add category: ${error.message}`);
  }
}

export async function renameCategory(userId: string, categoryId: string, name: string) {
  const supabase = await createDataClient();
  const { error } = await supabase
    .from("menu_categories")
    .update({ name })
    .eq("user_id", userId)
    .eq("id", categoryId);

  if (error) {
    throw new Error(`Failed to rename category: ${error.message}`);
  }
}

export async function listFavorites(userId: string): Promise<FavoriteMenu[]> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("favorite_menus")
    .select("id, name, kcal, category_id")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load favorite menus: ${error.message}`);
  }

  return ((data ?? []) as FavoriteRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    kcal: row.kcal,
    categoryId: row.category_id,
  }));
}

export async function upsertFavorite(input: {
  userId: string;
  name: string;
  kcal: number;
  categoryId: string;
}) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("favorite_menus")
    .upsert(
      {
        user_id: input.userId,
        name: input.name,
        kcal: input.kcal,
        category_id: input.categoryId,
      },
      { onConflict: "user_id,name" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save favorite menu: ${error?.message ?? "missing id"}`);
  }

  return data.id as string;
}

export async function getFavorite(userId: string, favoriteId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("favorite_menus")
    .select("id, name, kcal, category_id")
    .eq("user_id", userId)
    .eq("id", favoriteId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load favorite menu: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as FavoriteRow;
  return {
    id: row.id,
    name: row.name,
    kcal: row.kcal,
    categoryId: row.category_id,
  } satisfies FavoriteMenu;
}

export async function moveFavorite(
  userId: string,
  favoriteId: string,
  categoryId: string,
) {
  const supabase = await createDataClient();
  const { data: category, error: categoryError } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("user_id", userId)
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    throw new Error("Category was not found");
  }

  const { error } = await supabase
    .from("favorite_menus")
    .update({ category_id: categoryId })
    .eq("user_id", userId)
    .eq("id", favoriteId);

  if (error) {
    throw new Error(`Failed to move favorite menu: ${error.message}`);
  }
}

export async function loadDayScreen(userId: string, date: string, weekStartsOn: WeekStart) {
  const categories = await ensureDefaultCategories(userId);
  const bounds = weekBounds(date, weekStartsOn);
  const [meals, weekRows, favorites] = await Promise.all([
    listMeals(userId, date),
    listMealKcalBetween(userId, bounds.start, bounds.end),
    listFavorites(userId),
  ]);

  return {
    meals,
    categories,
    favorites,
    dayTotal: meals.reduce((sum, meal) => sum + meal.kcal, 0),
    weekTotal: weekRows.reduce((sum, meal) => sum + meal.kcal, 0),
  };
}
