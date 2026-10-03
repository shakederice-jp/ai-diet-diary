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

function floorHundreds(value: number) {
  return Math.floor((value + 1e-6) / 100) * 100;
}

function ceilHundreds(value: number) {
  return Math.ceil((value - 1e-6) / 100) * 100;
}

export function chooseTicks(min: number, max: number, candidates: number[], maxLabels: number) {
  const span = Math.max(max - min, 0);
  let step = candidates[candidates.length - 1] ?? 1;
  for (const candidate of candidates) {
    if (Math.floor(span / candidate) + 1 <= maxLabels) {
      step = candidate;
      break;
    }
  }

  const ticks: number[] = [];
  const start = Math.ceil((min - 1e-9) / step) * step;
  for (let value = start; value <= max + 1e-9; value += step) {
    const rounded = Math.round(value * 1000) / 1000;
    if (rounded < min - 1e-6 || rounded > max + 1e-6) {
      continue;
    }
    if (ticks[ticks.length - 1] !== rounded) {
      ticks.push(rounded);
    }
  }
  if (ticks.length === 0) {
    ticks.push(Math.round(min * 10) / 10);
  }
  return ticks;
}

export function weightScale(
  goal: MonthTrendGoal | null,
  values: number[],
): MonthTrendScale | null {
  const finite = values.filter((value) => Number.isFinite(value));
  let min: number;
  let max: number;
  let goalWeight: number | null = null;

  if (goal) {
    const low = Math.min(goal.currentWeightKg, goal.targetWeightKg);
    const high = Math.max(goal.currentWeightKg, goal.targetWeightKg);
    min = low - 5;
    max = high + 5;
    goalWeight = goal.targetWeightKg;
    if (finite.length > 0) {
      min = Math.min(min, ...finite);
      max = Math.max(max, ...finite);
    }
  } else if (finite.length > 0) {
    min = Math.min(...finite) - 2;
    max = Math.max(...finite) + 2;
  } else {
    return null;
  }

  if (!(max > min)) {
    max = min + 1;
  }

  return {
    min,
    max,
    ticks: chooseTicks(min, max, [1, 2, 5, 10], 6),
    goal: goalWeight,
  };
}

export function calorieScale(dailyGoal: number | null, values: number[]): MonthTrendScale | null {
  const finite = values.filter((value) => Number.isFinite(value) && value >= 0);
  const peak = finite.length > 0 ? Math.max(...finite) : 0;

  if (dailyGoal != null && dailyGoal > 0) {
    const min = Math.max(0, floorHundreds(dailyGoal - 800));
    let max = ceilHundreds(Math.max(dailyGoal + 800, peak));
    if (!(max > min)) {
      max = min + 100;
    }
    return {
      min,
      max,
      ticks: chooseTicks(min, max, [100, 200, 500, 1000], 5),
      goal: dailyGoal,
    };
  }

  if (finite.length === 0) {
    return null;
  }

  const max = Math.max(100, ceilHundreds(peak));
  return {
    min: 0,
    max,
    ticks: chooseTicks(0, max, [100, 200, 500, 1000], 5),
    goal: null,
  };
}

export function buildMonthTrend(input: {
  year: number;
  month: number;
  calories: CalorieInput[];
  weights: WeightInput[];
  goal: MonthTrendGoal | null;
  today: string;
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

  return {
    year: input.year,
    month: input.month,
    hasData,
    goalSet: goal != null,
    todayIndex: days.findIndex((day) => day.date === input.today),
    days,
    weight: hasData ? weightScale(goal, weightValues) : null,
    calories: hasData ? calorieScale(dailyGoal, kcalValues) : null,
  };
}
