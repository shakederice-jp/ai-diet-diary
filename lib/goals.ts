export const DEFAULT_WEEKLY_KCAL_GOAL = 14_000;

// Weekly targets are not configurable yet. Replace this with the saved goal.
export async function getWeeklyCalorieGoal(_userId: string) {
  return DEFAULT_WEEKLY_KCAL_GOAL;
}
