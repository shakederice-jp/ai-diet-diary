import {
  addMonths,
  buildMonthCalendar,
  recordedDaysAverage,
  weekBounds,
  type WeekStart,
} from "@/lib/calendar";
import { dailyCalorieGoalFromWeekly } from "@/lib/goals";
import { periodCalorieScale, periodWeightScale, type MonthTrendScale } from "@/lib/month-trend";

export const WEEK_SPAN_COUNT = 28;
export const MONTH_SPAN_COUNT = 12;

export type TrendSpan = "week" | "month";

export type TrendPoint = {
  key: string;
  axisLabel: string | null;
  yearLabel: string | null;
  partial: boolean;
  weightKg: number | null;
  kcal: number | null;
  recordedDays: number;
  detailTitle: string;
};

export type TrendSpanModel = {
  span: TrendSpan;
  page: number;
  maxPage: number;
  earliest: string | null;
  rangeLabel: string;
  summary: string;
  points: TrendPoint[];
  weight: MonthTrendScale | null;
  calories: MonthTrendScale | null;
  limitLabel: string | null;
};

type DailyKcal = { date: string; totalKcal: number };
type DailyWeight = { date: string; weightKg: number };

function addIsoDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  const from = Date.UTC(startYear, startMonth - 1, startDay);
  const to = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((to - from) / 86400000);
}

function slashDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}/${month}/${day}`;
}

function monthDay(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

function roundKg(value: number) {
  return Math.round(value * 10) / 10;
}

function eachDate(start: string, end: string) {
  const dates: string[] = [];
  for (let date = start; date <= end; date = addIsoDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function indexOfMonth(date: string) {
  const [year, month] = date.split("-").map(Number);
  return year * 12 + (month - 1);
}

export function maxWeekPage(today: string, earliest: string | null, weekStartsOn: WeekStart) {
  if (!earliest) {
    return 0;
  }
  const currentStart = weekBounds(today, weekStartsOn).start;
  const oldestStart = weekBounds(earliest, weekStartsOn).start;
  if (oldestStart > currentStart) {
    return 0;
  }
  return Math.floor(daysBetween(oldestStart, currentStart) / 7 / WEEK_SPAN_COUNT);
}

export function maxMonthPage(today: string, earliest: string | null) {
  if (!earliest) {
    return 0;
  }
  const back = indexOfMonth(today) - indexOfMonth(earliest);
  if (back <= 0) {
    return 0;
  }
  return Math.floor(back / MONTH_SPAN_COUNT);
}

export function weekWindow(today: string, page: number, weekStartsOn: WeekStart) {
  const currentStart = weekBounds(today, weekStartsOn).start;
  const lastStart = addIsoDays(currentStart, -7 * WEEK_SPAN_COUNT * page);
  const firstStart = addIsoDays(lastStart, -7 * (WEEK_SPAN_COUNT - 1));
  return Array.from({ length: WEEK_SPAN_COUNT }, (_, index) => {
    const start = addIsoDays(firstStart, 7 * index);
    return { start, end: addIsoDays(start, 6) };
  });
}

export function monthWindow(today: string, page: number) {
  const [year, month] = today.split("-").map(Number);
  const end = addMonths(year, month, -MONTH_SPAN_COUNT * page);
  return Array.from({ length: MONTH_SPAN_COUNT }, (_, index) =>
    addMonths(end.year, end.month, index - (MONTH_SPAN_COUNT - 1)),
  );
}

function averageNumber(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function summaryLine(prefix: string, average: number | null, unit: string) {
  return average == null ? `${prefix}: —` : `${prefix}: ${average.toLocaleString("ja-JP")}kcal / ${unit}`;
}

function maps(calories: DailyKcal[], weights: DailyWeight[]) {
  const kcalByDate = new Map<string, number>();
  for (const row of calories) {
    if (!Number.isFinite(row.totalKcal) || row.totalKcal < 0) {
      continue;
    }
    kcalByDate.set(row.date, (kcalByDate.get(row.date) ?? 0) + row.totalKcal);
  }
  const weightByDate = new Map<string, number>();
  for (const row of weights) {
    if (!Number.isFinite(row.weightKg) || row.weightKg <= 0) {
      continue;
    }
    weightByDate.set(row.date, row.weightKg);
  }
  return { kcalByDate, weightByDate };
}

export function buildWeekSpan(input: {
  today: string;
  page: number;
  weekStartsOn: WeekStart;
  earliest: string | null;
  weeklyKcal: number | null;
  calories: DailyKcal[];
  weights: DailyWeight[];
  weightScale?: MonthTrendScale | null;
}): TrendSpanModel {
  const maxPage = maxWeekPage(input.today, input.earliest, input.weekStartsOn);
  const page = Math.min(Math.max(0, Math.floor(input.page)), maxPage);
  const weeks = weekWindow(input.today, page, input.weekStartsOn);
  const { kcalByDate, weightByDate } = maps(input.calories, input.weights);
  const points: TrendPoint[] = weeks.map((week, index) => {
    let total = 0;
    let recordedDays = 0;
    const weights: number[] = [];
    for (const date of eachDate(week.start, week.end)) {
      if (kcalByDate.has(date)) {
        total += kcalByDate.get(date)!;
        recordedDays += 1;
      }
      if (weightByDate.has(date)) {
        weights.push(weightByDate.get(date)!);
      }
    }
    return {
      key: week.start,
      axisLabel: (index + 1) % 4 === 0 ? monthDay(week.start) : null,
      yearLabel: null,
      partial: week.start <= input.today && input.today <= week.end,
      weightKg: weights.length === 0 ? null : roundKg(weights.reduce((sum, value) => sum + value, 0) / weights.length),
      kcal: recordedDays === 0 ? null : total,
      recordedDays,
      detailTitle: `${monthDay(week.start)}〜${monthDay(week.end)}`,
    };
  });
  const limit = input.weeklyKcal != null && input.weeklyKcal > 0 ? input.weeklyKcal : null;
  const kcalValues = points.flatMap((point) => (point.kcal == null ? [] : [point.kcal]));
  const weightValues = points.flatMap((point) => (point.weightKg == null ? [] : [point.weightKg]));
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  return {
    span: "week",
    page,
    maxPage,
    earliest: input.earliest,
    rangeLabel: `${slashDate(first.start)}〜${slashDate(last.end)}`,
    summary: summaryLine(
      page === 0 ? "直近28週の平均" : "この28週の平均",
      averageNumber(kcalValues),
      "週",
    ),
    points,
    weight: input.weightScale ? input.weightScale : periodWeightScale(weightValues),
    calories: periodCalorieScale(limit, kcalValues),
    limitLabel: limit == null ? null : "上限",
  };
}

export function buildMonthSpan(input: {
  today: string;
  page: number;
  weekStartsOn: WeekStart;
  earliest: string | null;
  weeklyKcal: number | null;
  calories: DailyKcal[];
  weights: DailyWeight[];
  weightScale?: MonthTrendScale | null;
}): TrendSpanModel {
  const maxPage = maxMonthPage(input.today, input.earliest);
  const page = Math.min(Math.max(0, Math.floor(input.page)), maxPage);
  const months = monthWindow(input.today, page);
  const { weightByDate } = maps(input.calories, input.weights);
  const [todayYear, todayMonth] = input.today.split("-").map(Number);
  const todayParts = { year: todayYear, month: todayMonth, date: input.today };
  const points: TrendPoint[] = months.map(({ year, month }) => {
    const built = buildMonthCalendar({
      year,
      month,
      weekStartsOn: input.weekStartsOn,
      records: input.calories,
      today: todayParts,
    });
    const days = built.weeks.flatMap((week) => week.days);
    const stats = recordedDaysAverage(days, input.today);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const weights = [...weightByDate.entries()].flatMap(([date, weightKg]) =>
      date.startsWith(`${key}-`) ? [weightKg] : [],
    );
    return {
      key,
      axisLabel: `${month}月`,
      yearLabel: month === 1 ? String(year) : null,
      partial: year === todayYear && month === todayMonth,
      weightKg: weights.length === 0 ? null : roundKg(weights.reduce((sum, value) => sum + value, 0) / weights.length),
      kcal: stats.count === 0 ? null : stats.average,
      recordedDays: stats.count,
      detailTitle: `${year}年${month}月`,
    };
  });
  const dailyLimit =
    input.weeklyKcal != null && input.weeklyKcal > 0 ? dailyCalorieGoalFromWeekly(input.weeklyKcal) : null;
  const kcalValues = points.flatMap((point) => (point.kcal == null ? [] : [point.kcal]));
  const weightValues = points.flatMap((point) => (point.weightKg == null ? [] : [point.weightKg]));
  const first = months[0];
  const last = months[months.length - 1];
  const lastDay = new Date(Date.UTC(last.year, last.month, 0)).getUTCDate();
  return {
    span: "month",
    page,
    maxPage,
    earliest: input.earliest,
    rangeLabel: `${slashDate(`${first.year}-${String(first.month).padStart(2, "0")}-01`)}〜${slashDate(`${last.year}-${String(last.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`)}`,
    summary: summaryLine(
      page === 0 ? "直近12か月の平均" : "この12か月の平均",
      averageNumber(kcalValues),
      "日",
    ),
    points,
    weight: input.weightScale ? input.weightScale : periodWeightScale(weightValues),
    calories: periodCalorieScale(dailyLimit, kcalValues),
    limitLabel: dailyLimit == null ? null : "1日の上限",
  };
}
