import { Suspense } from "react";
import { cookies } from "next/headers";
import { EngagementPanel } from "@/components/engagement-panel";
import { HomeCalendar, HomeHealth } from "@/components/home-sections";
import {
  WEEK_START_COOKIE,
  parseMonthParam,
  parseWeekStart,
  tokyoToday,
} from "@/lib/calendar";
import { getAuthUserId } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type HomeSearchParams = Promise<{
  month?: string;
  login?: string;
  claim?: string;
  error?: string;
}>;

export default async function Home({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const userId = await getAuthUserId();
  if (!userId) {
    if (params.login === "error" || params.error === "link") {
      redirect("/login?error=link");
    }
    redirect("/login");
  }

  const today = tokyoToday();
  const month = parseMonthParam(params.month, today);
  const store = await cookies();
  const weekStartsOn = parseWeekStart(store.get(WEEK_START_COOKIE)?.value);

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans sm:px-6">
      <main className="flex w-full max-w-4xl flex-col gap-8">
        <Suspense fallback={null}>
          <EngagementPanel surface="home" />
        </Suspense>
        {params.claim === "error" ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            ログインはできましたが、以前の記録の引き継ぎに失敗しました。
          </p>
        ) : null}
        <Suspense
          fallback={
            <div
              className="h-80 animate-pulse rounded-3xl bg-[#F3EBDD]"
              aria-busy="true"
              aria-label="カレンダーを読み込んでいます"
            />
          }
        >
          <HomeCalendar
            userId={userId}
            year={month.year}
            month={month.month}
            weekStartsOn={weekStartsOn}
            today={today}
          />
        </Suspense>
        <Suspense fallback={null}>
          <HomeHealth userId={userId} />
        </Suspense>
      </main>
    </div>
  );
}
