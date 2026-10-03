import { NavAnchor } from "@/components/nav-anchor";
import { navQuiet } from "@/components/nav-styles";
import { getHealthPlanetConnection } from "@/lib/supabase/admin";

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
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-base text-zinc-600">Health Planet:連携済み</p>
          <NavAnchor href="/api/auth/healthplanet" className={`${navQuiet} w-full sm:w-auto`}>
            連携し直す
          </NavAnchor>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-base text-zinc-600">Health Planet:未連携</p>
          <NavAnchor href="/api/auth/healthplanet" className={`${navQuiet} w-full sm:w-auto`}>
            連携する
          </NavAnchor>
        </div>
      )}
    </section>
  );
}
