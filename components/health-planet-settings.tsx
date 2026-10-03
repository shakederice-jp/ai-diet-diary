import { getHealthPlanetConnection } from "@/lib/supabase/admin";

const connectClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-xs font-medium text-zinc-700 hover:bg-[#E7DCC8]";

function statusMessage(status?: string, reason?: string) {
  if (status === "connected") {
    return { tone: "ok" as const, text: "連携が完了しました" };
  }
  if (status !== "error") {
    return null;
  }
  if (reason === "invalid_oauth_state") {
    return { tone: "error" as const, text: "連携を確認できませんでした。もう一度お試しください。" };
  }
  if (reason === "login_required") {
    return { tone: "error" as const, text: "ログインしてから、もう一度連携してください。" };
  }
  if (reason === "cancelled") {
    return { tone: "error" as const, text: "連携がキャンセルされました。" };
  }
  return { tone: "error" as const, text: "連携に失敗しました。もう一度お試しください。" };
}

export async function HealthPlanetSettings({
  userId,
  status,
  reason,
}: {
  userId: string;
  status?: string;
  reason?: string;
}) {
  let connected = false;
  try {
    connected = Boolean(await getHealthPlanetConnection(userId));
  } catch {
    connected = false;
  }
  const message = statusMessage(status, reason);

  return (
    <section className="mt-8 border-t border-[#E4D7C6] pt-4">
      <h2 className="text-xs font-medium text-zinc-500">外部サービス連携</h2>
      {message ? (
        <p className={`mt-2 text-xs ${message.tone === "error" ? "text-red-800" : "text-zinc-600"}`}>
          {message.text}
        </p>
      ) : null}
      {connected ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
          <span>Health Planet:連携済み</span>
          <a href="/api/auth/healthplanet" className="inline-flex min-h-11 items-center text-xs text-zinc-500 underline underline-offset-2">
            連携し直す
          </a>
        </p>
      ) : (
        <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
          <span>Health Planet:未連携</span>
          <a href="/api/auth/healthplanet" className={connectClass}>
            連携する
          </a>
        </p>
      )}
    </section>
  );
}
