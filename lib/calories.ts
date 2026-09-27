export type DailyCalorieRecord = {
  date: string;
  totalKcal: number;
};

// Meal logging is not implemented yet. This returns no recorded days, so the
// calendar shows 0 kcal and averages skip every day. Replace the body with a
// query against the meal log table for the given month.
export async function getMealCalorieRecords(
  _year: number,
  _month: number,
): Promise<DailyCalorieRecord[]> {
  return [];
}
