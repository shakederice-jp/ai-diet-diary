import { listMealKcalBetween } from "@/lib/meals";

export type DailyCalorieRecord = {
  date: string;
  totalKcal: number;
};

export function parseManualKcal(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,5}$/.test(trimmed)) {
    return null;
  }
  const kcal = Number(trimmed);
  if (kcal > 10000) {
    return null;
  }
  return kcal;
}

export async function getMealCalorieRecords(
  userId: string,
  year: number,
  month: number,
): Promise<DailyCalorieRecord[]> {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const rows = await listMealKcalBetween(userId, start, end);
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.recorded_on, (totals.get(row.recorded_on) ?? 0) + row.kcal);
  }

  return [...totals.entries()].map(([date, totalKcal]) => ({ date, totalKcal }));
}
