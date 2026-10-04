import { Suspense } from "react";
import { headers } from "next/headers";
import { after } from "next/server";
import { InstantLink } from "@/components/instant-link";
import { navSecondary } from "@/components/nav-styles";
import { MonthCalendar } from "@/components/month-calendar";
import { MonthTrendChart } from "@/components/month-trend-chart";
import { getMealCalorieRecords, type DailyCalorieRecord } from "@/lib/calories";
import {
  buildMonthCalendar,
  type WeekStart,
} from "@/lib/calendar";
import { DEFAULT_WEEKLY_KCAL_GOAL } from "@/lib/goals";
import { buildMonthTrend } from "@/lib/month-trend";
import { listStepsInMonth } from "@/lib/steps";
import { getHealthPlanetToken } from "@/lib/supabase/admin";
import { getCalorieGoal, type StoredCalorieGoal } from "@/lib/user-settings";
import { syncHealthPlanetWeights } from "@/lib/weight-sync";
import { listWeightsInMonth } from "@/lib/weights";

const FRESH_SYNC_MS = 15 * 60 * 1000;

async function loadStoredGoal(userId: string) {
  if (!userId || userId === "local") {
    return null;
  }
  try {
    return await getCalorieGoal(userId);
  } catch {
    return null;
  }
}

function weeklyGoalFromStored(goal: StoredCalorieGoal | null) {
  if (!goal || goal.weeklyKcal <= 0) {
    return DEFAULT_WEEKLY_KCAL_GOAL;
  }
  return goal.weeklyKcal;
}

async function requestOrigin() {
  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "")
    .split(",")[0]
    .trim();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  return `${proto}://${host}`;
}

export async function HomeCalendar({
  userId,
  year,
  month,
  weekStartsOn,
  today,
}: {
  userId: string;
  year: number;
  month: number;
  weekStartsOn: WeekStart;
  today: { year: number; month: number; date: string };
}) {
  const [goal, calorieRecords, stepRecords] = await Promise.all([
    loadStoredGoal(userId),
    getMealCalorieRecords(userId, year, month).catch(() => [] as DailyCalorieRecord[]),
    listStepsInMonth(userId, year, month).catch(() => []),
  ]);
  const calendar = buildMonthCalendar({
    year,
    month,
    weekStartsOn,
    records: calorieRecords,
    steps: stepRecords,
    today,
  });

  return (
    <div className="flex w-full flex-col gap-8">
      <MonthCalendar
        model={calendar}
        weeklyGoal={weeklyGoalFromStored(goal)}
        today={today}
      />
      <Suspense fallback={null}>
        <HomeMonthTrend
          userId={userId}
          year={year}
          month={month}
          calories={calorieRecords}
          goal={goal}
          today={today.date}
        />
      </Suspense>
    </div>
  );
}

async function HomeMonthTrend({
  userId,
  year,
  month,
  calories,
  goal,
  today,
}: {
  userId: string;
  year: number;
  month: number;
  calories: DailyCalorieRecord[];
  goal: StoredCalorieGoal | null;
  today: string;
}) {
  const weights = await listWeightsInMonth(userId, year, month).catch(() => []);
  const model = buildMonthTrend({
    year,
    month,
    calories,
    weights,
    goal: goal
      ? {
          currentWeightKg: goal.currentWeightKg,
          targetWeightKg: goal.targetWeightKg,
          weeklyKcal: goal.weeklyKcal,
        }
      : null,
    today,
  });
  return <MonthTrendChart model={model} />;
}

export async function HomeHealth({ userId }: { userId: string }) {
  const configured = Boolean(
    process.env.HEALTHPLANET_CLIENT_ID &&
      process.env.HEALTHPLANET_CLIENT_SECRET &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  let connected = false;

  if (configured) {
    try {
      const stored = await getHealthPlanetToken(userId);
      connected = Boolean(stored);
      if (stored) {
        const syncedAt = stored.weight_synced_at ? new Date(stored.weight_synced_at).getTime() : 0;
        if (!(Number.isFinite(syncedAt) && Date.now() - syncedAt < FRESH_SYNC_MS)) {
          const origin = await requestOrigin();
          after(() => syncHealthPlanetWeights(userId, origin).catch(() => undefined));
        }
      }
    } catch {
      connected = true;
    }
  }

  if (connected) {
    return null;
  }

  return (
    <InstantLink href="/mypage" className={navSecondary}>
      体重の自動取り込みを設定する
    </InstantLink>
  );
}
