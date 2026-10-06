import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { signOut } from "@/app/login/actions";
import { InstantLink } from "@/components/instant-link";
import { SubmitButton } from "@/components/submit-button";
import { AdvisorPicker } from "@/components/advisor-picker";
import { EngagementPanel } from "@/components/engagement-panel";
import { HealthPlanetSettings } from "@/components/health-planet-settings";
import { WeekStartForm } from "@/components/week-start-form";
import { WeightAxisForm } from "@/components/weight-axis-form";
import { WEEK_START_COOKIE, parseWeekStart } from "@/lib/calendar";
import { formatWeightAxisKg } from "@/lib/weight-axis";
import { navPrimary, navQuiet, navSecondary } from "@/components/nav-styles";
import { ShareCardList } from "@/components/share-card-list";
import { getAdvisorPreference } from "@/lib/advisor-store";
import { listOwnShareCards } from "@/lib/share-store";
import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/supabase/server";
import { getWeightAxis, storageErrorMessage } from "@/lib/user-settings";
import type { AdvisorId } from "@/lib/advisors";

export const metadata: Metadata = {
  title: "マイページ | AI Diet Diary",
};

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ healthplanet?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }
  const store = await cookies();
  const weekStartsOn = parseWeekStart(store.get(WEEK_START_COOKIE)?.value);
  const weightAxis = await loadWeightAxis(userId);

  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF8F3] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <InstantLink href="/" className={navQuiet}>
          カレンダーに戻る
        </InstantLink>
        <p className="mt-6 text-sm font-medium text-[#F5821F]">マイページ</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">設定</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          プロフィールと目標カロリーをここから開きます。
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <InstantLink href="/settings" className={navPrimary}>
            プロフィール
          </InstantLink>
          <InstantLink href="/goals" className={navSecondary}>
            目標設定
          </InstantLink>
        </div>
        <div className="mt-6">
          <Suspense
            fallback={<p className="text-sm text-zinc-600">連続記録を読み込んでいます…</p>}
          >
            <EngagementPanel surface="mypage" />
          </Suspense>
        </div>
        <Suspense fallback={<p className="mt-6 text-sm text-zinc-600">アドバイザーを読み込んでいます…</p>}>
          <AdvisorSection userId={userId} />
        </Suspense>
        <Suspense fallback={null}>
          <OwnShareCards userId={userId} />
        </Suspense>
        <form action={signOut} className="mt-8">
          <SubmitButton
            pendingLabel="ログアウトしています…"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-6 text-base font-medium text-zinc-700 hover:bg-[#E7DCC8]"
          >
            ログアウト
          </SubmitButton>
        </form>
        <HealthPlanetSettings userId={userId} status={params.healthplanet} reason={params.reason} />
        <WeekStartForm weekStartsOn={weekStartsOn} />
        <WeightAxisForm
          initialMinKg={weightAxis.minKg}
          initialMaxKg={weightAxis.maxKg}
          loadError={weightAxis.loadError}
        />
      </main>
    </div>
  );
}

async function loadWeightAxis(userId: string) {
  try {
    const axis = await getWeightAxis(userId);
    return {
      minKg: axis ? formatWeightAxisKg(axis.minKg) : "",
      maxKg: axis ? formatWeightAxisKg(axis.maxKg) : "",
      loadError: null,
    };
  } catch {
    return {
      minKg: "",
      maxKg: "",
      loadError: "縦軸の設定を読み込めませんでした。グラフは自動の範囲のままです。",
    };
  }
}

async function OwnShareCards({ userId }: { userId: string }) {
  try {
    const cards = await listOwnShareCards(userId);
    return <ShareCardList cards={cards} />;
  } catch {
    return null;
  }
}

async function AdvisorSection({ userId }: { userId: string }) {
  let advisorId: AdvisorId | null = null;
  let loadError: string | null = null;
  try {
    advisorId = await getAdvisorPreference(userId);
  } catch (error) {
    loadError = storageErrorMessage(error, "アドバイザーを読み込めませんでした。");
  }

  if (loadError) {
    return <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>;
  }
  return (
    <div className="mt-6">
      <AdvisorPicker initialId={advisorId} />
    </div>
  );
}
