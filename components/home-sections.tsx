import { headers } from "next/headers";
import { MonthCalendar } from "@/components/month-calendar";
import { getMealCalorieRecords } from "@/lib/calories";
import {
  buildMonthCalendar,
  type WeekStart,
} from "@/lib/calendar";
import { getWeeklyCalorieGoal } from "@/lib/goals";
import { listStepsInMonth } from "@/lib/steps";
import {
  getHealthPlanetToken,
  listRecentWeightRecords,
  type WeightRecordSummary,
} from "@/lib/supabase/admin";
import { syncHealthPlanetWeights } from "@/lib/weight-sync";

const FRESH_SYNC_MS = 15 * 60 * 1000;

const weightDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatWeightKg(value: number | string) {
  const weight = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(weight)) {
    return "—";
  }
  return `${weight.toFixed(2)} kg`;
}

function syncFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "体重の取得に失敗しました";
  return message.length > 180 ? `${message.slice(0, 180)}…` : message;
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
  preserved,
}: {
  userId: string;
  year: number;
  month: number;
  weekStartsOn: WeekStart;
  today: { year: number; month: number; date: string };
  preserved: { healthplanet?: string; reason?: string };
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
      preserved={preserved}
    />
  );
}

export async function HomeHealth({
  userId,
  healthplanet,
  reason,
}: {
  userId: string;
  healthplanet?: string;
  reason?: string;
}) {
  const configured = Boolean(
    process.env.HEALTHPLANET_CLIENT_ID &&
      process.env.HEALTHPLANET_CLIENT_SECRET &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  let records: WeightRecordSummary[] = [];
  let saved: number | null = null;
  let syncError: string | null = null;
  let connected = false;

  if (configured) {
    try {
      const stored = await getHealthPlanetToken(userId);
      connected = Boolean(stored);
      if (stored) {
        const syncedAt = stored.weight_synced_at ? new Date(stored.weight_synced_at).getTime() : 0;
        if (Number.isFinite(syncedAt) && Date.now() - syncedAt < FRESH_SYNC_MS) {
          records = await listRecentWeightRecords(userId);
        } else {
          const result = await syncHealthPlanetWeights(userId, await requestOrigin());
          saved = result.status === "synced" ? result.saved : null;
          records = result.status === "synced" ? await listRecentWeightRecords(userId) : [];
        }
      }
    } catch (error) {
      syncError = syncFailureMessage(error);
      connected = true;
      try {
        records = await listRecentWeightRecords(userId);
      } catch {
        records = [];
      }
    }
  }

  const linked = healthplanet === "connected" || connected;
  const failed = healthplanet === "error";

  return (
    <section className="w-full rounded-3xl bg-[#F3EBDD] p-8 shadow-sm">
      <p className="text-sm font-medium text-[#F5821F]">AI Diet Diary</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Health Planet 連携</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        タニタ Health Planet の体組成・血圧・歩数データを取り込むために、アカウント連携を開始します。
      </p>

      {linked ? (
        <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Health Planet と連携済みです。
        </p>
      ) : null}

      {connected ? (
        <section className="mt-6">
          <h3 className="text-sm font-medium text-zinc-950">体重</h3>
          {syncError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
              体重の取得に失敗しました: {syncError}
            </p>
          ) : saved !== null && saved > 0 ? (
            <p className="mt-3 text-sm text-zinc-600">体重を {saved} 件保存しました。</p>
          ) : saved === 0 && records.length > 0 ? (
            <p className="mt-3 text-sm text-zinc-600">新しい体重データはありません。</p>
          ) : null}
          {records.length > 0 ? (
            <ul className="mt-3 divide-y divide-[#E4D7C6]">
              {records.map((record) => (
                <li key={record.measured_at} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-zinc-600">
                    {weightDateFormatter.format(new Date(record.measured_at))}
                  </span>
                  <span className="font-medium text-zinc-950">{formatWeightKg(record.weight_kg)}</span>
                </li>
              ))}
            </ul>
          ) : syncError ? null : (
            <p className="mt-3 text-sm text-zinc-600">まだ体重の記録がありません。</p>
          )}
        </section>
      ) : null}

      {failed ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          連携に失敗しました
          {reason ? `: ${reason}` : ""}
        </p>
      ) : null}

      {configured ? null : (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          HEALTHPLANET_CLIENT_ID / HEALTHPLANET_CLIENT_SECRET と Supabase の環境変数を設定してください。
        </p>
      )}

      <a
        href="/api/auth/healthplanet"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white transition-colors hover:bg-[#E06E0C]"
      >
        Health Planetと連携する
      </a>
    </section>
  );
}
