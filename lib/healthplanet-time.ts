const DAY_MS = 24 * 60 * 60 * 1000;

export const INITIAL_WEIGHT_LOOKBACK_MS = 30 * DAY_MS;
export const MAX_HEALTHPLANET_RANGE_MS = 89 * DAY_MS;

const TOKYO_OFFSET = "+09:00";

export function formatHealthPlanetTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = read("hour") === "24" ? "00" : read("hour");

  return `${read("year")}${read("month")}${read("day")}${hour}${read("minute")}${read("second")}`;
}

export function parseHealthPlanetTimestamp(value: string): Date {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/.exec(value);
  if (!match) {
    throw new Error(`Invalid Health Planet timestamp: ${value}`);
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  const date = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${TOKYO_OFFSET}`,
  );
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Health Planet timestamp: ${value}`);
  }
  return date;
}

export function buildSyncWindows(from: Date, to: Date, maxSpanMs: number) {
  const windows: Array<{ from: Date; to: Date }> = [];
  let cursor = from.getTime();
  const end = to.getTime();
  if (!Number.isFinite(cursor) || !Number.isFinite(end) || maxSpanMs <= 0) {
    return windows;
  }

  while (cursor < end) {
    const next = Math.min(cursor + maxSpanMs, end);
    if (next <= cursor) {
      break;
    }
    windows.push({ from: new Date(cursor), to: new Date(next) });
    cursor = next;
  }

  return windows;
}
