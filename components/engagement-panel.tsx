import { FreezeChoice } from "@/components/freeze-choice";
import { RankingSwitch } from "@/components/ranking-switch";
import {
  affectionStageLabel,
  formatMonthDay,
  loadEngagement,
  type EngagementSnapshot,
} from "@/lib/engagement";
import { getAuthUserId } from "@/lib/supabase/server";

function engagementErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/schema cache|does not exist|Could not find the table/i.test(message)) {
    return "連続記録用のテーブルがありません。マイグレーションを適用してください。";
  }
  return "連続記録を読み込めませんでした。";
}

export async function EngagementPanel({ surface }: { surface: "home" | "mypage" }) {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  let snapshot: EngagementSnapshot;
  try {
    snapshot = await loadEngagement(userId);
  } catch (error) {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{engagementErrorMessage(error)}</p>
    );
  }

  if (surface === "home") {
    if (!snapshot.offerDate) {
      return null;
    }
    return (
      <section className="rounded-2xl bg-[#F3EBDD] px-4 py-3" aria-label="フリーズの確認">
        <FreezeChoice missedOn={snapshot.offerDate} label={formatMonthDay(snapshot.offerDate)} />
      </section>
    );
  }

  return (
    <section aria-label="記録の継続">
      <h2 className="text-xs font-medium text-zinc-500">記録の継続</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-700">
        {snapshot.streakDays > 0 ? `連続記録 ${snapshot.streakDays}日` : "連続記録はまだありません。"}
      </p>
      <p className="text-sm leading-6 text-zinc-700">今月のフリーズ残り {snapshot.freezeRemaining}回</p>
      {snapshot.compareEnabled && snapshot.rankingText ? (
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          連続記録は、全ユーザーの{snapshot.rankingText}です。
        </p>
      ) : null}
      <RankingSwitch initialEnabled={snapshot.compareEnabled} />
      <AffectionLine snapshot={snapshot} />
    </section>
  );
}

function AffectionLine({ snapshot }: { snapshot: EngagementSnapshot }) {
  if (!snapshot.advisorId || !snapshot.advisorName) {
    return (
      <p className="mt-3 text-sm leading-6 text-zinc-800">
        好感度は、アドバイザーを選んでから記録した日に増えます。
      </p>
    );
  }

  return (
    <p className="mt-3 text-sm leading-6 text-zinc-900">
      {snapshot.advisorName}との好感度 {snapshot.affectionPoints}（{affectionStageLabel(snapshot.affectionStage)}）
    </p>
  );
}
