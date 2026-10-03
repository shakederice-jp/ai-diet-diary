import { headers } from "next/headers";
import { InstantLink } from "@/components/instant-link";
import { MonthCalendar } from "@/components/month-calendar";
import { getMealCalorieRecords } from "@/lib/calories";
import {
  buildMonthCalendar,
  type WeekStart,
} from "@/lib/calendar";
import { getWeeklyCalorieGoal } from "@/lib/goals";
import { listStepsInMonth } from "@/lib/steps";
import { getHealthPlanetToken } from "@/lib/supabase/admin";
import { syncHealthPlanetWeights } from "@/lib/weight-sync";

const FRESH_SYNC_MS = 15 * 60 * 1000;

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
  const [weeklyGoal, calorieRecords, stepRecords] = await Promise.all([
    getWeeklyCalorieGoal(userId),
    getMealCalorieRecords(userId, year, month).catch(() => []),
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
    <MonthCalendar
      model={calendar}
      weekStartsOn={weekStartsOn}
      weeklyGoal={weeklyGoal}
      today={today}
    />
  );
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
          await syncHealthPlanetWeights(userId, await requestOrigin());
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
    <p className="text-sm">
      <InstantLink
        href="/mypage"
        className="inline-flex min-h-11 items-center text-zinc-500 underline-offset-2 hover:underline"
      >
        体重の自動取り込みを設定する
      </InstantLink>
    </p>
  );
}
