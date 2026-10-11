import { completeClaudeText } from "@/lib/claude";
import { tokyoToday } from "@/lib/calendar";
import {
  parseRecipeSuggestion,
  RECIPE_DAILY_LIMIT,
  RECIPE_FAILED_MESSAGE,
  RECIPE_LIMIT_MESSAGE,
  RECIPE_UNAVAILABLE_MESSAGE,
  NEED_MORE_RECORDS_MESSAGE,
  type SavedRecipe,
} from "@/lib/recipe-parse";
import { RECIPE_SYSTEM_PROMPT } from "@/lib/recipe-prompt";
import { createDataClient } from "@/lib/supabase/server";
import { getCalorieGoal } from "@/lib/user-settings";

const RECIPE_HISTORY_LIMIT = 10;

export type RecipePageData =
  | { status: "unavailable" }
  | { status: "error"; message: string }
  | { status: "need-records"; history: SavedRecipe[] }
  | { status: "ready"; remaining: number; history: SavedRecipe[] };

type SuggestionRow = {
  id: string;
  created_at: string;
  main_ingredients: unknown;
  suggestions: unknown;
  closing: string;
};

type MealRow = {
  recorded_on: string;
  name: string;
  kcal: number;
};

function shiftIsoDate(date: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return date;
  }
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return utc.toISOString().slice(0, 10);
}

function tokyoDateKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isMissingRecipeTable(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /schema cache|does not exist|Could not find the table/i.test(message)
  );
}

function readSaved(row: SuggestionRow): SavedRecipe | null {
  const parsed = parseRecipeSuggestion(
    JSON.stringify({
      main_ingredients: row.main_ingredients,
      suggestions: row.suggestions,
      closing: row.closing,
    }),
  );
  if (!parsed) {
    return null;
  }
  return { id: row.id, createdAt: row.created_at, ...parsed };
}

async function listRecentRows(userId: string, sinceIso: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("recipe_suggestions")
    .select("id, created_at, main_ingredients, suggestions, closing")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { error, rows: [] as SuggestionRow[] };
  }
  return { error: null, rows: (data ?? []) as SuggestionRow[] };
}

async function listRecentMeals(userId: string, start: string, end: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("meal_records")
    .select("recorded_on, name, kcal")
    .eq("user_id", userId)
    .gte("recorded_on", start)
    .lte("recorded_on", end)
    .order("recorded_on", { ascending: true })
    .limit(300);

  if (error) {
    throw new Error(`Failed to load meals: ${error.message}`);
  }
  return (data ?? []) as MealRow[];
}

function dishNames(rows: SuggestionRow[]) {
  const names: string[] = [];
  for (const row of rows) {
    if (!Array.isArray(row.suggestions)) {
      continue;
    }
    for (const item of row.suggestions) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const name = (item as { name?: unknown }).name;
      if (typeof name === "string" && name.trim() && !names.includes(name.trim())) {
        names.push(name.trim());
      }
    }
  }
  return names.slice(0, 40);
}

function buildUserPrompt(input: {
  today: string;
  meals: MealRow[];
  dailyKcal: number | null;
  previousNames: string[];
}) {
  const lines = ["直近14日間の食事記録:"];
  if (input.meals.length === 0) {
    lines.push("なし");
  } else {
    let current = "";
    for (const meal of input.meals) {
      if (meal.recorded_on !== current) {
        current = meal.recorded_on;
        lines.push(current);
      }
      lines.push(`- ${meal.name} ${meal.kcal}kcal`);
    }
  }
  if (input.dailyKcal !== null) {
    lines.push(`1日あたりのカロリー上限の目安: ${input.dailyKcal}kcal`);
  }
  lines.push(`今日の日付: ${input.today}`);
  lines.push("過去30日以内に提案した料理名:");
  lines.push(input.previousNames.length > 0 ? input.previousNames.join("、") : "なし");
  return lines.join("\n");
}

export async function loadRecipePage(userId: string, now = new Date()): Promise<RecipePageData> {
  const today = tokyoToday(now).date;
  const since = new Date(`${shiftIsoDate(today, -29)}T00:00:00+09:00`).toISOString();
  const listed = await listRecentRows(userId, since);
  if (listed.error) {
    if (isMissingRecipeTable(listed.error)) {
      return { status: "unavailable" };
    }
    return { status: "error", message: "保存済みの提案を読み込めませんでした。しばらくしてから、もう一度開いてください。" };
  }

  const history = listed.rows
    .map(readSaved)
    .filter((item): item is SavedRecipe => item !== null)
    .slice(0, RECIPE_HISTORY_LIMIT);
  const usedToday = listed.rows.filter((row) => tokyoDateKey(row.created_at) === today).length;

  let meals: MealRow[] = [];
  try {
    meals = await listRecentMeals(userId, shiftIsoDate(today, -13), today);
  } catch {
    return { status: "error", message: "食事の記録を読み込めませんでした。しばらくしてから、もう一度開いてください。" };
  }

  const days = new Set(meals.map((meal) => meal.recorded_on));
  if (days.size < 3) {
    return { status: "need-records", history };
  }

  return { status: "ready", remaining: Math.max(0, RECIPE_DAILY_LIMIT - usedToday), history };
}

export async function createRecipeSuggestion(userId: string, now = new Date()): Promise<
  | { ok: true; recipe: SavedRecipe }
  | { ok: false; message: string; kind: "unavailable" | "need-records" | "limit" | "failed" }
> {
  const today = tokyoToday(now).date;
  const since = new Date(`${shiftIsoDate(today, -29)}T00:00:00+09:00`).toISOString();
  const listed = await listRecentRows(userId, since);
  if (listed.error) {
    if (isMissingRecipeTable(listed.error)) {
      return { ok: false, kind: "unavailable", message: RECIPE_UNAVAILABLE_MESSAGE };
    }
    return { ok: false, kind: "failed", message: RECIPE_FAILED_MESSAGE };
  }

  const usedToday = listed.rows.filter((row) => tokyoDateKey(row.created_at) === today).length;
  if (usedToday >= RECIPE_DAILY_LIMIT) {
    return { ok: false, kind: "limit", message: RECIPE_LIMIT_MESSAGE };
  }

  let meals: MealRow[] = [];
  try {
    meals = await listRecentMeals(userId, shiftIsoDate(today, -13), today);
  } catch {
    return { ok: false, kind: "failed", message: RECIPE_FAILED_MESSAGE };
  }
  const days = new Set(meals.map((meal) => meal.recorded_on));
  if (days.size < 3) {
    return { ok: false, kind: "need-records", message: NEED_MORE_RECORDS_MESSAGE };
  }

  let dailyKcal: number | null = null;
  try {
    const goal = await getCalorieGoal(userId);
    dailyKcal = goal && goal.dailyKcal > 0 ? Math.round(goal.dailyKcal) : null;
  } catch {
    dailyKcal = null;
  }

  let text = "";
  try {
    text = await completeClaudeText({
      system: RECIPE_SYSTEM_PROMPT,
      prompt: buildUserPrompt({
        today,
        meals,
        dailyKcal,
        previousNames: dishNames(listed.rows),
      }),
      maxTokens: 4096,
    });
  } catch {
    return { ok: false, kind: "failed", message: RECIPE_FAILED_MESSAGE };
  }

  const parsed = parseRecipeSuggestion(text);
  if (!parsed) {
    return { ok: false, kind: "failed", message: RECIPE_FAILED_MESSAGE };
  }

  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("recipe_suggestions")
    .insert({
      user_id: userId,
      main_ingredients: parsed.mainIngredients,
      suggestions: parsed.suggestions.map((dish) => ({
        name: dish.name,
        type: dish.type,
        kcal_per_serving: dish.kcalPerServing,
        why_filling: dish.whyFilling,
        ingredients: dish.ingredients,
        steps: dish.steps,
        tip: dish.tip,
      })),
      closing: parsed.closing,
    })
    .select("id, created_at, main_ingredients, suggestions, closing")
    .single();

  if (error || !data) {
    if (isMissingRecipeTable(error)) {
      return { ok: false, kind: "unavailable", message: RECIPE_UNAVAILABLE_MESSAGE };
    }
    return { ok: false, kind: "failed", message: RECIPE_FAILED_MESSAGE };
  }

  const saved = readSaved(data as SuggestionRow);
  if (!saved) {
    return { ok: false, kind: "failed", message: RECIPE_FAILED_MESSAGE };
  }
  return { ok: true, recipe: saved };
}
