import { FreezeChoice } from "@/components/freeze-choice";
import { RankingSwitch } from "@/components/ranking-switch";
import {
  affectionStageLabel,
  formatMonthDay,
  loadEngagement,
  type EngagementSnapshot,
} from "@/lib/engagement";
import { readUserIdFromCookies } from "@/lib/session";

function engagementErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/schema cache|does not exist|Could not find the table/i.test(message)) {
    return "連続記録用のテーブルがありません。マイグレーションを適用してください。";
  }
  return "連続記録を読み込めませんでした。";
}

export async function EngagementPanel({ surface }: { surface: "home" | "mypage" }) {
  const userId = await readUserIdFromCookies();
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

  const showStreak = snapshot.streakDays > 0 && (snapshot.atRisk || snapshot.offerDate || surface === "mypage");
  if (surface === "home" && !snapshot.atRisk && !snapshot.offerDate && !snapshot.compareEnabled) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-[#E7DCC8] p-5" aria-label="記録の継続">
      <p className="text-sm font-medium text-[#F5821F]">記録の継続</p>
      {showStreak ? (
        <p className="mt-2 text-sm leading-6 text-zinc-900">
          連続記録 {snapshot.streakDays}日
          {snapshot.atRisk ? "。今日はまだ記録がありません。" : "。"}
        </p>
      ) : surface === "mypage" ? (
        <p className="mt-2 text-sm leading-6 text-zinc-800">連続記録はまだありません。</p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-zinc-800">今月のフリーズ残り {snapshot.freezeRemaining}回</p>
      {snapshot.offerDate ? (
        <FreezeChoice missedOn={snapshot.offerDate} label={formatMonthDay(snapshot.offerDate)} />
      ) : null}
      {snapshot.compareEnabled && snapshot.rankingText ? (
        <p className="mt-2 text-sm leading-6 text-zinc-900">
          連続記録は、全ユーザーの{snapshot.rankingText}です。
        </p>
      ) : null}
      {surface === "mypage" ? <RankingSwitch initialEnabled={snapshot.compareEnabled} /> : null}
      {surface === "mypage" ? <AffectionLine snapshot={snapshot} /> : null}
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
