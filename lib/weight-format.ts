export type WeightDayRecord = {
  id: string;
  measuredAt: string;
  weightKg: number;
  source: string;
};

const TOKYO = "Asia/Tokyo";

function tokyoParts(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TOKYO,
    hourCycle: "h23",
    ...options,
  }).formatToParts(date);
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  const value = parts.find((item) => item.type === type)?.value ?? "";
  return type === "hour" && value === "24" ? "00" : value;
}

export function tokyoDateTimeLocal(date = new Date()) {
  const parts = tokyoParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}T${part(parts, "hour")}:${part(parts, "minute")}`;
}

export function dateTimeLocalOnPageDate(pageDate: string, now = new Date()) {
  return `${pageDate}T${tokyoDateTimeLocal(now).slice(11, 16)}`;
}

export function tokyoDateFromInstant(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const parts = tokyoParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

function isIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function parseTokyoDateTimeLocal(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const [, date, hour, minute] = match;
  if (!isIsoDate(date) || Number(hour) > 23 || Number(minute) > 59) {
    return null;
  }
  const instant = new Date(`${date}T${hour}:${minute}:00+09:00`);
  if (Number.isNaN(instant.getTime())) {
    return null;
  }
  return instant.toISOString();
}

export function parseWeightKg(value: string) {
  const trimmed = value.trim();
  if (!/^\d{1,3}(\.\d)?$/.test(trimmed)) {
    return null;
  }
  const weight = Number(trimmed);
  if (weight < 20 || weight > 300) {
    return null;
  }
  return weight;
}

export function formatWeightKg(value: number, source: string) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return source === "manual" ? `${value.toFixed(1)} kg` : `${value.toFixed(2)} kg`;
}

export function weightSourceLabel(source: string) {
  if (source === "manual") {
    return "手入力";
  }
  if (source === "healthplanet") {
    return "Health Planet";
  }
  return source;
}

const tokyoDateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TOKYO,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTokyoDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return tokyoDateTimeFormatter.format(date);
}

export function tokyoDayRange(date: string) {
  const start = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function tokyoMonthRange(year: number, month: number) {
  const startLabel = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endLabel = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const start = new Date(`${startLabel}T00:00:00+09:00`);
  const end = new Date(`${endLabel}T00:00:00+09:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error(`Invalid month: ${year}-${month}`);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export function latestDailyWeights(
  rows: Array<{ measuredAt: string; weightKg: number }>,
) {
  const sorted = [...rows].sort((left, right) => left.measuredAt.localeCompare(right.measuredAt));
  const byDate = new Map<string, number>();
  for (const row of sorted) {
    if (!Number.isFinite(row.weightKg) || row.weightKg <= 0) {
      continue;
    }
    const date = tokyoDateFromInstant(row.measuredAt);
    if (!date) {
      continue;
    }
    byDate.set(date, row.weightKg);
  }
  return [...byDate.entries()]
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((left, right) => left.date.localeCompare(right.date));
}
