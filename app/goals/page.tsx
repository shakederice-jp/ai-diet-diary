import type { Metadata } from "next";
import { InstantLink } from "@/components/instant-link";
import { redirect } from "next/navigation";
import { GoalForm } from "@/components/goal-form";
import { SettingsFrame } from "@/components/settings-frame";
import {
  decimalInputValue,
  planGapLabel,
  planPeriodLabel,
  type PeriodUnit,
} from "@/lib/calorie-plan";
import { formatKcal } from "@/lib/calendar";
import { getAuthUserId } from "@/lib/supabase/server";
import { listRecentWeightRecords } from "@/lib/supabase/admin";
import {
  getCalorieGoal,
  getProfile,
  storageErrorMessage,
  type StoredCalorieGoal,
  type StoredProfile,
} from "@/lib/user-settings";

export const metadata: Metadata = {
  title: "目標設定 | AI Diet Diary",
};

const kcalFigure = "font-mono tabular-nums slashed-zero";

export default async function GoalsPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }
  let profile: StoredProfile | null = null;
  let goal: StoredCalorieGoal | null = null;
  let loadError: string | null = null;
  let suggestedWeight = "";

  if (userId) {
    const [profileResult, goalResult] = await Promise.all([
      getProfile(userId).then(
        (value) => ({ ok: true as const, value }),
        (error: unknown) => ({ ok: false as const, error }),
      ),
      getCalorieGoal(userId).then(
        (value) => ({ ok: true as const, value }),
        (error: unknown) => ({ ok: false as const, error }),
      ),
    ]);
    const failure = !profileResult.ok
      ? profileResult.error
      : !goalResult.ok
        ? goalResult.error
        : null;
    if (failure) {
      loadError = storageErrorMessage(failure, "目標を読み込めませんでした。");
    } else if (profileResult.ok && goalResult.ok) {
      profile = profileResult.value;
      goal = goalResult.value;
    }

    if (!loadError && profile && !goal) {
      try {
        const recent = await listRecentWeightRecords(userId, 1);
        const weight = recent[0] ? Number(recent[0].weight_kg) : Number.NaN;
        if (Number.isFinite(weight)) {
          const rounded = Math.round(weight * 10) / 10;
          if (rounded >= 20 && rounded <= 300) {
            suggestedWeight = decimalInputValue(rounded);
          }
        }
      } catch {
        suggestedWeight = "";
      }
    }
  }

  const initial = {
    currentWeightKg: goal ? decimalInputValue(goal.currentWeightKg) : suggestedWeight,
    targetWeightKg: goal ? decimalInputValue(goal.targetWeightKg) : "",
    periodUnit: (goal?.periodUnit ?? "weeks") as PeriodUnit,
    periodCount: goal ? String(goal.periodCount) : "",
  };

  return (
    <SettingsFrame
      current="goals"
      eyebrow="目標設定"
      title="体重とカロリー"
      description="現在の体重、目標体重、達成までの期間から、1日の目安摂取カロリーと週の目標を計算します。"
    >
      {loadError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      {!loadError && !profile ? (
        <div className="rounded-2xl bg-[#E7DCC8] p-5">
          <p className="text-sm leading-6 text-zinc-700">
            目安カロリーを計算するには、先に身長・生年月日・性別・活動量を設定してください。
          </p>
          <InstantLink
            href="/settings"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C]"
          >
            プロフィールを設定する
          </InstantLink>
        </div>
      ) : null}

      {!loadError && profile ? (
        <div className="space-y-8">
          {goal ? <GoalSummary goal={goal} /> : null}
          <GoalForm
            initial={initial}
            weightHint={
              !goal && suggestedWeight ? "直近に記録した体重を入れています。" : null
            }
          />
        </div>
      ) : null}
    </SettingsFrame>
  );
}

function GoalSummary({ goal }: { goal: StoredCalorieGoal }) {
  const weightChange = goal.currentWeightKg - goal.targetWeightKg;
  const direction =
    weightChange > 0 ? "減量" : weightChange < 0 ? "増量" : "体重維持";

  return (
    <section className="rounded-2xl bg-[#E7DCC8] p-5">
      <p className="text-sm text-zinc-600">1日の目安摂取カロリー</p>
      <p className={`mt-1 text-4xl font-semibold text-[#F5821F] ${kcalFigure}`}>
        {formatKcal(goal.dailyKcal)}
      </p>
      <p className={`mt-2 text-sm text-zinc-700 ${kcalFigure}`}>
        週の目標（7倍） {formatKcal(goal.weeklyKcal)}
      </p>
      <p className="mt-3 text-sm text-zinc-700">
        現在 {decimalInputValue(goal.currentWeightKg)}kg、目標{" "}
        {decimalInputValue(goal.targetWeightKg)}kg（{direction}）。期間は
        {planPeriodLabel(goal.periodUnit, goal.periodCount, goal.periodDays)}です。
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-zinc-600">基礎代謝</dt>
          <dd className={`text-sm font-semibold text-zinc-950 ${kcalFigure}`}>
            {formatKcal(goal.bmrKcal)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600">1日の消費カロリー</dt>
          <dd className={`text-sm font-semibold text-zinc-950 ${kcalFigure}`}>
            {formatKcal(goal.tdeeKcal)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600">{planGapLabel(goal.dailyDeficitKcal)}</dt>
          <dd className={`text-sm font-semibold text-zinc-950 ${kcalFigure}`}>
            {formatKcal(Math.abs(goal.dailyDeficitKcal))}
          </dd>
        </div>
      </dl>
      {goal.floorApplied ? (
        <p className="mt-4 text-sm leading-6 text-zinc-700">
          計算上の摂取量が下限 {formatKcal(goal.floorKcal)}{" "}
          を下回るため、そこまで引き上げています。この摂取量では、設定した期間内に目標体重へ届かないことがあります。
        </p>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-zinc-600">
        プロフィールを変えたあとは、もう一度保存すると目安が更新されます。
      </p>
    </section>
  );
}
