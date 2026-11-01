import type { CalendarWeek } from "@/lib/calendar";

export function weeksAgainstLimit(weeks: CalendarWeek[], weeklyLimit: number) {
  const rows = weeks
    .map((week, index) => {
      const inMonth = week.days.filter((day) => day.inMonth);
      const total = inMonth.reduce((sum, day) => sum + day.kcal, 0);
      const recorded = inMonth.some((day) => day.recorded);
      return {
        label: `${index + 1}週目`,
        total,
        recorded,
        within: recorded && total <= weeklyLimit,
      };
    })
    .filter((row) => row.recorded);
  return {
    rows,
    withinCount: rows.filter((row) => row.within).length,
  };
}

export function weightMonthStats(weights: Array<{ date: string; weightKg: number }>) {
  const sorted = weights
    .filter((row) => Number.isFinite(row.weightKg) && row.weightKg > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return null;
  }
  const values = sorted.map((row) => row.weightKg);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return {
    first,
    last,
    min: Math.min(...values),
    max: Math.max(...values),
    change: Math.round((last.weightKg - first.weightKg) * 10) / 10,
  };
}
