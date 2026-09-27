import { cookies } from "next/headers";
import { getHealthPlanetConnection } from "@/lib/supabase/admin";
import { USER_COOKIE, verifySignedValue } from "@/lib/session";

type HomeSearchParams = Promise<{
  healthplanet?: string;
  reason?: string;
}>;

async function getConnectionStatus() {
  const clientId = process.env.HEALTHPLANET_CLIENT_ID;
  const clientSecret = process.env.HEALTHPLANET_CLIENT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clientId || !clientSecret || !supabaseUrl || !serviceRoleKey) {
    return { connected: false as const, configured: false as const };
  }

  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) {
    return { connected: false as const, configured: true as const };
  }

  const userId = verifySignedValue(raw, clientSecret);
  if (!userId) {
    return { connected: false as const, configured: true as const };
  }

  try {
    const connection = await getHealthPlanetConnection(userId);
    return {
      connected: Boolean(connection),
      configured: true as const,
    };
  } catch {
    return { connected: false as const, configured: true as const };
  }
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
