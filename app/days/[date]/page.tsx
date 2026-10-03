import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DayBody } from "@/components/day-body";
import { InstantLink } from "@/components/instant-link";
import { MealEntryForm } from "@/components/meal-entry-form";
import {
  WEEK_START_COOKIE,
  formatJapaneseDate,
  formatMonthParam,
  parseIsoDate,
  parseWeekStart,
} from "@/lib/calendar";
import { mealPeriodForTokyoHour, tokyoHour } from "@/lib/meal-slot";
import { getAuthUserId } from "@/lib/supabase/server";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsed = parseIsoDate(date);
  if (!parsed) {
    notFound();
  }

  const store = await cookies();
  const weekStartsOn = parseWeekStart(store.get(WEEK_START_COOKIE)?.value);
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/");
  }

  const initialPeriod = mealPeriodForTokyoHour(tokyoHour());

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 dark:bg-black">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8 dark:bg-zinc-950">
        <InstantLink
          href={`/?month=${formatMonthParam(parsed.year, parsed.month)}`}
          className="text-sm font-medium text-[#F5821F]"
        >
          カレンダーに戻る
        </InstantLink>
        <p className="mt-4 text-sm font-medium text-[#F5821F]">食事記録</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {formatJapaneseDate(parsed.date)}
        </h1>
        <MealEntryForm date={parsed.date} initialPeriod={initialPeriod} />
        <Suspense
          fallback={
            <div className="mt-6 space-y-4" aria-busy="true">
              <div className="h-28 animate-pulse rounded-2xl bg-[#E7DCC8]" />
              <p className="text-sm text-zinc-600">記録を読み込んでいます…</p>
            </div>
          }
        >
          <DayBody
            userId={userId}
            date={parsed.date}
            weekStartsOn={weekStartsOn}
          />
        </Suspense>
      </main>
    </div>
  );
}
