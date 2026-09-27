import { cookies, headers } from "next/headers";
import { syncHealthPlanetWeights } from "@/lib/weight-sync";
import {
  getHealthPlanetConnection,
  listRecentWeightRecords,
  type WeightRecordSummary,
} from "@/lib/supabase/admin";
import { USER_COOKIE, verifySignedValue } from "@/lib/session";

type HomeSearchParams = Promise<{
  healthplanet?: string;
  reason?: string;
}>;

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
  const message =
    error instanceof Error ? error.message : "体重の取得に失敗しました";
  return message.length > 180 ? `${message.slice(0, 180)}…` : message;
}

async function getRequestOrigin() {
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

async function getConnectionStatus() {
  const clientId = process.env.HEALTHPLANET_CLIENT_ID;
  const clientSecret = process.env.HEALTHPLANET_CLIENT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clientId || !clientSecret || !supabaseUrl || !serviceRoleKey) {
    return {
      connected: false as const,
      configured: false as const,
      userId: null as string | null,
    };
  }

  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) {
    return {
      connected: false as const,
      configured: true as const,
      userId: null,
    };
  }

  const userId = verifySignedValue(raw, clientSecret);
  if (!userId) {
    return {
      connected: false as const,
      configured: true as const,
      userId: null,
    };
  }

  try {
    const connection = await getHealthPlanetConnection(userId);
    return {
      connected: Boolean(connection),
      configured: true as const,
      userId,
    };
  } catch {
    return {
      connected: false as const,
      configured: true as const,
      userId: null,
    };
  }
}

async function loadWeights(userId: string) {
  const origin = await getRequestOrigin();
  const result = await syncHealthPlanetWeights(userId, origin);
  const records =
    result.status === "synced" ? await listRecentWeightRecords(userId) : [];
  return {
    saved: result.status === "synced" ? result.saved : null,
    records,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const status = await getConnectionStatus();
  const linked = params.healthplanet === "connected" || status.connected;
  const failed = params.healthplanet === "error";

  let records: WeightRecordSummary[] = [];
  let saved: number | null = null;
  let syncError: string | null = null;
  if (status.connected && status.userId) {
    try {
      const weights = await loadWeights(status.userId);
      records = weights.records;
      saved = weights.saved;
    } catch (error) {
      syncError = syncFailureMessage(error);
      try {
        records = await listRecentWeightRecords(status.userId);
      } catch {
        records = [];
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500">AI Diet Diary</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Health Planet 連携
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          タニタ Health Planet の体組成・血圧・歩数データを取り込むために、アカウント連携を開始します。
        </p>

        {linked ? (
          <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Health Planet と連携済みです。
          </p>
        ) : null}

        {status.connected ? (
          <section className="mt-6">
            <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              体重
            </h2>
            {syncError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                体重の取得に失敗しました: {syncError}
              </p>
            ) : saved !== null && saved > 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                体重を {saved} 件保存しました。
              </p>
            ) : saved === 0 && records.length > 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                新しい体重データはありません。
              </p>
            ) : null}
            {records.length > 0 ? (
              <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
                {records.map((record) => (
                  <li
                    key={record.measured_at}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {weightDateFormatter.format(new Date(record.measured_at))}
                    </span>
                    <span className="font-medium text-zinc-950 dark:text-zinc-50">
                      {formatWeightKg(record.weight_kg)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : syncError ? null : (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                まだ体重の記録がありません。
              </p>
            )}
          </section>
        ) : null}

        {failed ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            連携に失敗しました
            {params.reason ? `: ${params.reason}` : ""}
          </p>
        ) : null}

        {!status.configured ? (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            HEALTHPLANET_CLIENT_ID / HEALTHPLANET_CLIENT_SECRET と Supabase
            の環境変数を設定してください。
          </p>
        ) : null}

        <a
          href="/api/auth/healthplanet"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Health Planetと連携する
        </a>
      </main>
    </div>
  );
}
