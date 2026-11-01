import { csvDocument } from "@/lib/csv";
import { listDiaryInMonth } from "@/lib/diary";
import { kcalSourceLabel } from "@/lib/meal-slot";
import { listMealDetailsBetween } from "@/lib/meals";
import { canViewMonth, getHistoryLimit } from "@/lib/plan";
import { getAuthUserId } from "@/lib/supabase/server";
import { listWeightsInMonth } from "@/lib/weights";

function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return null;
  }
  return { year, month, key: `${match[1]}-${match[2]}` };
}

export async function GET(request: Request, context: { params: Promise<{ month: string }> }) {
  const { month: monthParam } = await context.params;
  const parsed = parseMonth(monthParam);
  const userId = await getAuthUserId();
  if (!parsed || !userId) {
    return new Response("ログインしてください。", { status: 401 });
  }
  const user = { id: userId };
  getHistoryLimit(user);
  if (!canViewMonth(user, parsed.key)) {
    return new Response("この月は表示できません。", { status: 404 });
  }

  const kind = new URL(request.url).searchParams.get("kind");
  const start = `${parsed.key}-01`;
  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  const end = `${parsed.key}-${String(lastDay).padStart(2, "0")}`;
  const filename =
    kind === "meals" ? `memolever-${parsed.key}-meals.csv` : `memolever-${parsed.key}-daily.csv`;

  const meals = await listMealDetailsBetween(userId, start, end);
  let body: string;
  if (kind === "meals") {
    body = csvDocument([
      ["日付", "時間帯", "外食・内食・中食", "料理名", "kcal", "入力"],
      ...meals.map((meal) => [
        meal.recorded_on,
        meal.meal_period,
        meal.meal_source ?? "",
        meal.name,
        meal.kcal,
        kcalSourceLabel(meal.kcal_source === "manual" ? "manual" : "ai"),
      ]),
    ]);
  } else {
    const [weights, diaries] = await Promise.all([
      listWeightsInMonth(userId, parsed.year, parsed.month),
      listDiaryInMonth(userId, start, end),
    ]);
    const weightByDate = new Map(weights.map((row) => [row.date, row.weightKg]));
    const diaryByDate = new Map(diaries.map((row) => [row.date, row.body]));
    const dates = new Set<string>([
      ...meals.map((meal) => meal.recorded_on),
      ...weightByDate.keys(),
      ...diaryByDate.keys(),
    ]);
    const rows = [...dates].sort().map((date) => {
      const dayMeals = meals.filter((meal) => meal.recorded_on === date);
      const sum = (period: string) =>
        dayMeals.filter((meal) => meal.meal_period === period).reduce((total, meal) => total + meal.kcal, 0);
      const total = dayMeals.reduce((acc, meal) => acc + meal.kcal, 0);
      return [
        date,
        total,
        sum("朝食"),
        sum("昼食"),
        sum("夕食"),
        sum("間食"),
        weightByDate.get(date) ?? "",
        diaryByDate.get(date) ?? "",
      ];
    });
    body = csvDocument([["日付", "合計kcal", "朝食kcal", "昼食kcal", "夕食kcal", "間食kcal", "体重", "日記"], ...rows]);
  }

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "x-robots-tag": "noindex",
    },
  });
}
