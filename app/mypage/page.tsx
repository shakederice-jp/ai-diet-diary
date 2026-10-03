import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/app/login/actions";
import { InstantLink } from "@/components/instant-link";
import { SubmitButton } from "@/components/submit-button";
import { AdvisorPicker } from "@/components/advisor-picker";
import { EngagementPanel } from "@/components/engagement-panel";
import { HealthPlanetSettings } from "@/components/health-planet-settings";
import { getAdvisorPreference } from "@/lib/advisor-store";
import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/supabase/server";
import { storageErrorMessage } from "@/lib/user-settings";
import type { AdvisorId } from "@/lib/advisors";

export const metadata: Metadata = {
  title: "マイページ | AI Diet Diary",
};

const filledLink =
  "inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C]";
const outlineLink =
  "inline-flex h-12 items-center justify-center rounded-full border border-[#F5821F] bg-[#FBF6EE] px-6 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8]";

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

  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF8F3] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <InstantLink href="/" className="text-sm font-medium text-[#F5821F]">
          カレンダーに戻る
        </InstantLink>
        <p className="mt-6 text-sm font-medium text-[#F5821F]">マイページ</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">設定</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          プロフィールと目標カロリーをここから開きます。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <InstantLink href="/settings" className={filledLink}>
            プロフィール
          </InstantLink>
          <InstantLink href="/goals" className={outlineLink}>
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
        <form action={signOut} className="mt-8">
          <SubmitButton
            pendingLabel="ログアウトしています…"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-6 text-sm font-medium text-zinc-700 hover:bg-[#E7DCC8]"
          >
            ログアウト
          </SubmitButton>
        </form>
        <HealthPlanetSettings userId={userId} status={params.healthplanet} reason={params.reason} />
      </main>
    </div>
  );
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
