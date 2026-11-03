import {
  chooseWeightAxisTicks,
  goalWeightInAxis,
  hasWeightOutsideRange,
  integerWeightScale,
  type WeightAxisRange,
} from "./weight-axis";

export type MonthTrendGoal = {
  currentWeightKg: number;
  targetWeightKg: number;
  weeklyKcal: number;
};

export type MonthTrendDay = {
  date: string;
  day: number;
  weightKg: number | null;
  kcal: number | null;
};

export type MonthTrendScale = {
  min: number;
  max: number;
  ticks: number[];
  goal: number | null;
};

export type MonthTrendModel = {
  year: number;
  month: number;
  hasData: boolean;
  goalSet: boolean;
  todayIndex: number;
  days: MonthTrendDay[];
  weight: MonthTrendScale | null;
  calories: MonthTrendScale | null;
  weightOutside: boolean;
};

type CalorieInput = {
  date: string;
  totalKcal: number;
};

type WeightInput = {
  date: string;
  weightKg: number;
};

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function showDayLabel(day: number) {
  return day === 1 || day % 5 === 0;
}

export function formatAxisKg(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatRecordedKg(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const text = rounded
    .toFixed(2)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  return `${text}kg`;
}

const KCAL_STEPS = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];

function snap(value: number, step: number) {
  const places = step < 1 ? 1 : 0;
  return Math.round(value * 10 ** places) / 10 ** places;
}

/** 表示中の最小〜最大を、等間隔の目盛り3つで覆い、上下に目盛り間隔の2割を余白として足す。 */
export function paddedThreeTicks(
  low: number,
  high: number,
  steps: readonly number[],
  options?: { floor?: number; minPad?: number },
) {
  const minPad = options?.minPad ?? 0;
  const floor = options?.floor;
  let bottom = low;
  let top = high;
  if (!(top > bottom)) {
    const bump = Math.max(minPad, steps[0] ?? 1);
    bottom -= bump;
    top += bump;
  }
  if (floor != null) {
    bottom = Math.max(floor, bottom);
    if (!(top > bottom)) {
      top = bottom + (steps[0] ?? 1);
    }
  }

  for (const step of steps) {
    if (step * 2 + 1e-9 < top - bottom) {
      continue;
    }
    let start = Math.floor((bottom + step * 1e-9) / step) * step;
    if (floor != null && start < floor - 1e-9) {
      start = floor;
    }
    const end = start + step * 2;
    if (start - 1e-6 > bottom || end + 1e-6 < top) {
      continue;
    }
    const ticks = [0, 1, 2].map((index) => snap(start + index * step, step));
    const slack = step * 0.2;
    let min = ticks[0] - slack;
    let max = ticks[2] + slack;
    if (step >= 1) {
      min = Math.floor(min);
      max = Math.ceil(max);
      if (min >= ticks[0]) {
        min = floor != null ? Math.max(floor, ticks[0]) : ticks[0] - 1;
      }
      if (max <= ticks[2]) {
        max = ticks[2] + 1;
      }
    } else {
      min = snap(min, 0.1);
      max = snap(max, 0.1);
    }
    if (floor != null) {
      min = Math.max(floor, min);
    }
    return { min, max, ticks };
  }

  const step = steps[steps.length - 1] ?? 1;
  const start = floor != null ? Math.max(floor, snap(bottom, step)) : snap(bottom, step);
  const ticks = [0, 1, 2].map((index) => snap(start + index * step, step));
  return { min: ticks[0], max: ticks[2], ticks };
}

export function sharedWeightScale(
  extent: { minKg: number; maxKg: number } | null,
  axis: WeightAxisRange | null,
): MonthTrendScale | null {
  const saved =
    axis &&
    Number.isFinite(axis.minKg) &&
    Number.isFinite(axis.maxKg) &&
    axis.maxKg >= axis.minKg + 2
      ? axis
      : null;
  if (saved) {
    return {
      min: saved.minKg,
      max: saved.maxKg,
      ticks: chooseWeightAxisTicks(saved.minKg, saved.maxKg),
      goal: null,
    };
  }
  if (!extent || !Number.isFinite(extent.minKg) || !Number.isFinite(extent.maxKg) || extent.maxKg < extent.minKg) {
    return null;
  }
  return { ...integerWeightScale(extent.minKg, extent.maxKg), goal: null };
}

export function weightScale(
  goal: MonthTrendGoal | null,
  values: number[],
  axis: WeightAxisRange | null = null,
): MonthTrendScale | null {
  if (axis) {
    return {
      min: axis.minKg,
      max: axis.maxKg,
      ticks: chooseWeightAxisTicks(axis.minKg, axis.maxKg),
      goal: goalWeightInAxis(goal?.targetWeightKg ?? null, axis.minKg, axis.maxKg),
    };
  }

  const finite = values.filter((value) => Number.isFinite(value));
  const points = goal ? [...finite, goal.currentWeightKg, goal.targetWeightKg] : finite;
  if (points.length === 0) {
    return null;
  }
  const scale = integerWeightScale(Math.min(...points), Math.max(...points));
  return {
    ...scale,
    goal: goalWeightInAxis(goal?.targetWeightKg ?? null, scale.min, scale.max),
  };
}

export function periodWeightScale(values: number[]): MonthTrendScale | null {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return null;
  }
  return { ...integerWeightScale(Math.min(...finite), Math.max(...finite)), goal: null };
}

export function periodCalorieScale(limit: number | null, values: number[]): MonthTrendScale | null {
  return calorieScale(limit, values);
}

export function calorieScale(dailyGoal: number | null, values: number[]): MonthTrendScale | null {
  const finite = values.filter((value) => Number.isFinite(value) && value >= 0);
  const goal = dailyGoal != null && dailyGoal > 0 ? dailyGoal : null;
  const points = goal == null ? finite : [...finite, goal];
  if (points.length === 0) {
    return null;
  }
  const scale = paddedThreeTicks(Math.min(...points), Math.max(...points), KCAL_STEPS, {
    floor: 0,
    minPad: 100,
  });
  return {
    ...scale,
    goal,
  };
}

export function buildMonthTrend(input: {
  year: number;
  month: number;
  calories: CalorieInput[];
  weights: WeightInput[];
  goal: MonthTrendGoal | null;
  today: string;
  axis?: WeightAxisRange | null;
  weightScale?: MonthTrendScale | null;
}): MonthTrendModel {
  const key = monthKey(input.year, input.month);
  const weightByDate = new Map<string, number>();
  for (const row of input.weights) {
    if (!row.date.startsWith(`${key}-`) || !Number.isFinite(row.weightKg) || row.weightKg <= 0) {
      continue;
    }
    weightByDate.set(row.date, row.weightKg);
  }
  const kcalByDate = new Map<string, number>();
  for (const row of input.calories) {
    if (!row.date.startsWith(`${key}-`) || !Number.isFinite(row.totalKcal) || row.totalKcal < 0) {
      continue;
    }
    kcalByDate.set(row.date, (kcalByDate.get(row.date) ?? 0) + row.totalKcal);
  }

  const count = daysInMonth(input.year, input.month);
  const days: MonthTrendDay[] = [];
  for (let day = 1; day <= count; day += 1) {
    const date = `${key}-${String(day).padStart(2, "0")}`;
    days.push({
      date,
      day,
      weightKg: weightByDate.has(date) ? weightByDate.get(date)! : null,
      kcal: kcalByDate.has(date) ? kcalByDate.get(date)! : null,
    });
  }

  const weightValues = days.flatMap((day) => (day.weightKg == null ? [] : [day.weightKg]));
  const kcalValues = days.flatMap((day) => (day.kcal == null ? [] : [day.kcal]));
  const goal =
    input.goal &&
    input.goal.weeklyKcal > 0 &&
    Number.isFinite(input.goal.currentWeightKg) &&
    Number.isFinite(input.goal.targetWeightKg)
      ? input.goal
      : null;
  const hasData = weightValues.length > 0 || kcalValues.length > 0;
  const dailyGoal = goal ? goal.weeklyKcal / 7 : null;
  const axis =
    input.axis &&
    Number.isFinite(input.axis.minKg) &&
    Number.isFinite(input.axis.maxKg) &&
    input.axis.maxKg >= input.axis.minKg + 2
      ? input.axis
      : null;

  return {
    year: input.year,
    month: input.month,
    hasData,
    goalSet: goal != null,
    todayIndex: days.findIndex((day) => day.date === input.today),
    days,
    weight: input.weightScale
      ? {
          ...input.weightScale,
          goal: goalWeightInAxis(goal?.targetWeightKg ?? null, input.weightScale.min, input.weightScale.max),
        }
      : hasData
        ? weightScale(goal, weightValues, axis)
        : null,
    calories: hasData ? calorieScale(dailyGoal, kcalValues) : null,
    weightOutside: axis ? hasWeightOutsideRange(weightValues, axis.minKg, axis.maxKg) : false,
  };
}
