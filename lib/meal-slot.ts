export const MEAL_PERIODS = ["朝食", "昼食", "夕食", "間食"] as const;
export const MEAL_SOURCES = ["外食", "内食", "中食"] as const;
export const KCAL_SOURCES = ["manual", "ai"] as const;

export type MealPeriod = (typeof MEAL_PERIODS)[number];
export type MealSource = (typeof MEAL_SOURCES)[number];
export type KcalSource = (typeof KCAL_SOURCES)[number];

export function kcalSourceLabel(source: KcalSource) {
  return source === "manual" ? "手入力" : "AI推定";
}

export const SOURCE_COLORS: Record<MealSource, string> = {
  外食: "#C8553D",
  内食: "#6B9A73",
  中食: "#D9A441",
};
export const SNACK_COLOR = "#8E7CA8";

export function mealTone(period: MealPeriod, source: MealSource | null) {
  if (period === "間食" || !source) {
    return SNACK_COLOR;
  }
  return SOURCE_COLORS[source];
}

const PERIOD_SET = new Set<string>(MEAL_PERIODS);
const SOURCE_SET = new Set<string>(MEAL_SOURCES);

export function parseMealPeriod(value: string): MealPeriod | null {
  return PERIOD_SET.has(value) ? (value as MealPeriod) : null;
}

export function parseMealSource(value: string): MealSource | null {
  return SOURCE_SET.has(value) ? (value as MealSource) : null;
}

export function mealPeriodForTokyoHour(hour: number): MealPeriod {
  if (hour < 11) {
    return "朝食";
  }
  if (hour < 14) {
    return "昼食";
  }
  if (hour < 18) {
    return "間食";
  }
  return "夕食";
}

export function tokyoHour(now = new Date()) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hourCycle: "h23",
  }).format(now);
  const value = Number(hour);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value === 24 ? 0 : value;
}

export type BandMeal = {
  kcal: number;
  mealPeriod: MealPeriod;
  mealSource: MealSource | null;
};

export type BandSlice = {
  period: MealPeriod;
  source: MealSource | null;
  kcal: number;
  color: string;
  y: number;
  height: number;
};

export type CalorieBand = {
  slices: BandSlice[];
  labels: Array<{ period: MealPeriod; y: number; height: number }>;
  chartHeight: number;
  goalLineY: number;
  totalKcal: number;
};

const GOAL_PX = 240;

export function buildCalorieBand(meals: BandMeal[], dailyGoal: number): CalorieBand {
  const totals = new Map<string, number>();
  for (const meal of meals) {
    if (!Number.isFinite(meal.kcal) || meal.kcal <= 0) {
      continue;
    }
    const source = meal.mealPeriod === "間食" ? null : (meal.mealSource ?? "内食");
    const key = `${meal.mealPeriod}:${source ?? ""}`;
    totals.set(key, (totals.get(key) ?? 0) + meal.kcal);
  }

  const totalKcal = [...totals.values()].reduce((sum, kcal) => sum + kcal, 0);
  const scale = dailyGoal > 0 ? GOAL_PX / dailyGoal : totalKcal > 0 ? GOAL_PX / totalKcal : 0;
  const chartHeight = Math.max(GOAL_PX, totalKcal * scale);
  const slices: BandSlice[] = [];
  let cursor = chartHeight;

  for (const period of MEAL_PERIODS) {
    const parts: Array<{ source: MealSource | null; color: string }> =
      period === "間食"
        ? [{ source: null, color: SNACK_COLOR }]
        : MEAL_SOURCES.map((source) => ({ source, color: SOURCE_COLORS[source] }));

    for (const part of parts) {
      const kcal = totals.get(`${period}:${part.source ?? ""}`) ?? 0;
      if (kcal <= 0) {
        continue;
      }
      const height = kcal * scale;
      cursor -= height;
      slices.push({
        period,
        source: part.source,
        kcal,
        color: part.color,
        y: cursor,
        height,
      });
    }
  }

  const labels = MEAL_PERIODS.flatMap((period) => {
    const group = slices.filter((slice) => slice.period === period);
    if (group.length === 0) {
      return [];
    }
    const top = Math.min(...group.map((slice) => slice.y));
    const bottom = Math.max(...group.map((slice) => slice.y + slice.height));
    return [{ period, y: top, height: bottom - top }];
  });

  return {
    slices,
    labels,
    chartHeight,
    goalLineY: chartHeight - (dailyGoal > 0 ? GOAL_PX : 0),
    totalKcal,
  };
}
