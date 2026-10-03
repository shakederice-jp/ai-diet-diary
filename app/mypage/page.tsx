import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { AdvisorPicker } from "@/components/advisor-picker";
import { EngagementPanel } from "@/components/engagement-panel";
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

export default async function MyPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/");
  }
  let advisorId: AdvisorId | null = null;
  let loadError: string | null = null;

  if (userId) {
    try {
      advisorId = await getAdvisorPreference(userId);
    } catch (error) {
      loadError = storageErrorMessage(error, "アドバイザーを読み込めませんでした。");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF8F3] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-medium text-[#F5821F]">
          カレンダーに戻る
        </Link>
        <p className="mt-6 text-sm font-medium text-[#F5821F]">マイページ</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">設定</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          プロフィールと目標カロリーをここから開きます。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/settings" className={filledLink}>
            プロフィール
          </Link>
          <Link href="/goals" className={outlineLink}>
            目標設定
          </Link>
        </div>
        <div className="mt-6">
          <EngagementPanel surface="mypage" />
        </div>
        {loadError ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
        ) : (
          <AdvisorPicker initialId={advisorId} />
        )}
        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-6 text-sm font-medium text-zinc-700 hover:bg-[#E7DCC8]"
          >
            ログアウト
          </button>
        </form>
      </main>
    </div>
  );
}
