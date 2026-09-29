import { getCalorieGoal } from "./user-settings";

export const DEFAULT_WEEKLY_KCAL_GOAL = 14_000;

export async function getWeeklyCalorieGoal(userId: string) {
  if (!userId || userId === "local") {
    return DEFAULT_WEEKLY_KCAL_GOAL;
  }

  try {
    const goal = await getCalorieGoal(userId);
    if (!goal || goal.weeklyKcal <= 0) {
      return DEFAULT_WEEKLY_KCAL_GOAL;
    }
    return goal.weeklyKcal;
  } catch {
    return DEFAULT_WEEKLY_KCAL_GOAL;
  }
}

export function dailyCalorieGoalFromWeekly(weeklyGoal: number) {
  return weeklyGoal / 7;
}
