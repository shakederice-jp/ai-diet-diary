import type { DailyCalorieRecord } from "./calories";

export const WEEK_START_COOKIE = "calendar_week_start";

export type WeekStart = "sunday" | "monday";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
  kcal: number;
  recorded: boolean;
  steps: number | null;
};

export type CalendarWeek = {
  days: CalendarDay[];
  averageKcal: number | null;
};

export type MonthCalendarModel = {
  year: number;
  month: number;
  title: string;
  weekdayLabels: string[];
  weeks: CalendarWeek[];
  weekdayAverages: Array<number | null>;
  monthTotalKcal: number;
  averageKcal: number | null;
};

export function parseWeekStart(value: string | undefined | null): WeekStart {
  return value === "monday" ? "monday" : "sunday";
}

export function tokyoToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month, day] = parts.split("-").map(Number);
  return { year, month, day, date: parts };
}

export function parseMonthParam(
  value: string | undefined,
  today = tokyoToday(),
) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return { year: today.year, month: today.month };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return { year: today.year, month: today.month };
  }
  return { year, month };
}

export function addMonths(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function formatMonthParam(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, date: value };
}

export function formatJapaneseDate(date: string) {
  const parsed = parseIsoDate(date);
  if (!parsed) {
    return date;
  }
  const utc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const weekday = WEEKDAY_LABELS[utc.getUTCDay()];
  return `${parsed.year}年${parsed.month}月${parsed.day}日（${weekday}）`;
}

export function formatKcalAmount(value: number) {
  const rounded = Math.round(value);
  const digits = String(Number.isFinite(rounded) ? rounded : 0);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatKcal(value: number) {
  return `${formatKcalAmount(value)}kcal`;
}

export function weekBounds(date: string, weekStartsOn: WeekStart) {
  const parsed = parseIsoDate(date);
  if (!parsed) {
    throw new Error(`Invalid date: ${date}`);
  }

  const weekday = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay();
  const offset = weekStartsOn === "monday" ? (weekday + 6) % 7 : weekday;
  const start = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day - offset));
  const end = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day - offset + 6));
  const iso = (value: Date) =>
    `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;

  return { start: iso(start), end: iso(end) };
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftUtcDate(year: number, month: number, day: number, deltaDays: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function weekdayIndex(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function averageRecordedKcal(days: CalendarDay[], excludeDate?: string) {
  let sum = 0;
  let count = 0;
  for (const day of days) {
    if (!day.recorded || day.date === excludeDate) {
      continue;
    }
    sum += day.kcal;
    count += 1;
  }
  return count === 0 ? null : sum / count;
}

export function buildMonthCalendar(input: {
  year: number;
  month: number;
  weekStartsOn: WeekStart;
  records: DailyCalorieRecord[];
  steps?: Array<{ date: string; steps: number }>;
  today?: { year: number; month: number; date?: string };
}): MonthCalendarModel {
  const totals = new Map<string, number>();
  for (const record of input.records) {
    if (!Number.isFinite(record.totalKcal)) {
      continue;
    }
    totals.set(record.date, (totals.get(record.date) ?? 0) + record.totalKcal);
  }
  const stepsByDate = new Map<string, number>();
  for (const record of input.steps ?? []) {
    if (!Number.isFinite(record.steps)) {
      continue;
    }
    stepsByDate.set(record.date, record.steps);
  }

  const daysInMonth = new Date(Date.UTC(input.year, input.month, 0)).getUTCDate();
  const startIndex =
    input.weekStartsOn === "monday"
      ? (weekdayIndex(input.year, input.month, 1) + 6) % 7
      : weekdayIndex(input.year, input.month, 1);
  const labels =
    input.weekStartsOn === "monday"
      ? [...WEEKDAY_LABELS.slice(1), WEEKDAY_LABELS[0]]
      : [...WEEKDAY_LABELS];

  const cellCount = Math.ceil((startIndex + daysInMonth) / 7) * 7;
  const first = shiftUtcDate(input.year, input.month, 1, -startIndex);
  const days: CalendarDay[] = [];

  for (let index = 0; index < cellCount; index += 1) {
    const current = shiftUtcDate(first.year, first.month, first.day, index);
    const date = isoDate(current.year, current.month, current.day);
    const inMonth = current.year === input.year && current.month === input.month;
    const recorded = inMonth && totals.has(date);
    days.push({
      date,
      day: current.day,
      inMonth,
      kcal: recorded ? totals.get(date)! : 0,
      recorded,
      steps: inMonth && stepsByDate.has(date) ? stepsByDate.get(date)! : null,
    });
  }

  const today = input.today ?? tokyoToday();
  const todayDate = today.date ?? tokyoToday().date;
  const weeks: CalendarWeek[] = [];
  for (let index = 0; index < days.length; index += 7) {
    const weekDays = days.slice(index, index + 7);
    weeks.push({
      days: weekDays,
      averageKcal: averageRecordedKcal(weekDays, todayDate),
    });
  }

  const weekdayAverages = labels.map((_, column) =>
    averageRecordedKcal(
      weeks
        .map((week) => week.days[column])
        .filter((day) => day != null && day.inMonth),
      todayDate,
    ),
  );
  const monthTotalKcal = days.reduce(
    (sum, day) => sum + (day.inMonth ? day.kcal : 0),
    0,
  );

  let recordedSum = 0;
  let recordedCount = 0;
  for (const day of days) {
    if (!day.recorded || day.date === todayDate) {
      continue;
    }
    recordedSum += day.kcal;
    recordedCount += 1;
  }
  const title =
    input.year === today.year ? `${input.month}月` : `${input.year}年${input.month}月`;

  return {
    year: input.year,
    month: input.month,
    title,
    weekdayLabels: labels,
    weeks,
    weekdayAverages,
    monthTotalKcal,
    averageKcal: recordedCount === 0 ? null : recordedSum / recordedCount,
  };
}
