export type RecipeDish = {
  name: string;
  type: string;
  kcalPerServing: number;
  whyFilling: string;
  ingredients: string[];
  steps: string[];
  tip: string;
};

export type RecipeSuggestion = {
  mainIngredients: string[];
  suggestions: RecipeDish[];
  closing: string;
};

export type SavedRecipe = RecipeSuggestion & {
  id: string;
  createdAt: string;
};

export const RECIPE_DAILY_LIMIT = 3;
export const NEED_MORE_RECORDS_MESSAGE =
  "もう少し記録がたまったら、あなたに合ったメニューを提案しますね";
export const RECIPE_UNAVAILABLE_MESSAGE =
  "メニュー提案の保存が、まだ準備できていません。しばらくしてから、もう一度開いてください。";
export const RECIPE_LIMIT_MESSAGE =
  "今日の提案は3回までです。また明日、新しいメニューを考えてみましょう。";
export const RECIPE_FAILED_MESSAGE = "提案を作れませんでした。もう一度試してください。";

function asText(value: unknown, max: number) {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) {
    return null;
  }
  return text.slice(0, max);
}

function asList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) {
    return null;
  }
  const items = value
    .map((item) => asText(item, maxLength))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
  return items.length > 0 ? items : null;
}

function asKcal(value: unknown) {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const kcal = Math.round(numeric);
  if (kcal < 1 || kcal > 2000) {
    return null;
  }
  return kcal;
}

function parseDish(value: unknown): RecipeDish | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const dish = value as Record<string, unknown>;
  const name = asText(dish.name, 80);
  const type = asText(dish.type, 40);
  const kcalPerServing = asKcal(dish.kcal_per_serving);
  const whyFilling = asText(dish.why_filling, 200);
  const ingredients = asList(dish.ingredients, 12, 80);
  const steps = asList(dish.steps, 8, 200);
  const tip = asText(dish.tip, 200);
  if (!name || !type || kcalPerServing === null || !whyFilling || !ingredients || !steps || !tip) {
    return null;
  }
  return { name, type, kcalPerServing, whyFilling, ingredients, steps, tip };
}

export function parseRecipeSuggestion(text: string): RecipeSuggestion | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1] ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const mainIngredients = asList(record.main_ingredients, 5, 20);
  const closing = asText(record.closing, 400);
  if (!mainIngredients || !closing || !Array.isArray(record.suggestions)) {
    return null;
  }

  const suggestions = record.suggestions
    .map((item) => parseDish(item))
    .filter((item): item is RecipeDish => item !== null)
    .slice(0, 3);
  if (suggestions.length !== 3) {
    return null;
  }

  return { mainIngredients, suggestions, closing };
}
