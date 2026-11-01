import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { InstantLink } from "@/components/instant-link";
import { MonthTrendChart } from "@/components/month-trend-chart";
import { SiteFooter } from "@/components/site-footer";
import { navQuiet } from "@/components/nav-styles";
import { getMealCalorieRecords } from "@/lib/calories";
import {
  WEEK_START_COOKIE,
  addMonths,
  buildMonthCalendar,
  formatJapaneseDate,
  formatKcal,
  formatKcalAmount,
  formatMonthParam,
  parseWeekStart,
  recordedDaysAverage,
  tokyoToday,
} from "@/lib/calendar";
import { listDiaryInMonth } from "@/lib/diary";
import { getWeeklyCalorieGoal } from "@/lib/goals";
import { weeksAgainstLimit, weightMonthStats } from "@/lib/month-summary";
import { buildMonthTrend } from "@/lib/month-trend";
import { canViewMonth, getHistoryLimit } from "@/lib/plan";
import { pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";
import { getCalorieGoal, getWeightAxis } from "@/lib/user-settings";
import { listWeightsInMonth } from "@/lib/weights";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  return pageMetadata({
    title: "月のまとめ",
    path: `/months/${month}`,
    index: false,
  });
}

function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return null;
  }
  return { year, month, key: `${match[1]}-${match[2]}` };
}

function formatKg(value: number) {
  return `${value.toFixed(1)}kg`;
}

function formatChange(value: number) {
  if (value === 0) {
    return "±0kg";
  }
  const sign = value > 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(1)}kg`;
}

export default async function MonthSummaryPage({ params }: { params: Promise<{ month: string }> }) {
  const { month: monthParam } = await params;
  const parsed = parseMonth(monthParam);
  if (!parsed) {
    notFound();
  }
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }
  const user = { id: userId };
  getHistoryLimit(user);
  if (!canViewMonth(user, parsed.key)) {
    notFound();
  }

  const today = tokyoToday();
  const future =
    parsed.year > today.year || (parsed.year === today.year && parsed.month > today.month);
  if (future) {
    redirect(`/months/${formatMonthParam(today.year, today.month)}`);
  }

  const store = await cookies();
  const weekStartsOn = parseWeekStart(store.get(WEEK_START_COOKIE)?.value);
  const start = `${parsed.key}-01`;
  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  const end = `${parsed.key}-${String(lastDay).padStart(2, "0")}`;

  const [records, weights, diaries, weeklyLimit, goal, axis] = await Promise.all([
    getMealCalorieRecords(userId, parsed.year, parsed.month).catch(() => []),
    listWeightsInMonth(userId, parsed.year, parsed.month).catch(() => []),
    listDiaryInMonth(userId, start, end).catch(() => []),
    getWeeklyCalorieGoal(userId),
    getCalorieGoal(userId).catch(() => null),
    getWeightAxis(userId).catch(() => null),
  ]);

  const calendar = buildMonthCalendar({
    year: parsed.year,
    month: parsed.month,
    weekStartsOn,
    records,
    today,
  });
  const recorded = recordedDaysAverage(
    calendar.weeks.flatMap((week) => week.days),
    today.date,
  );
  const weeks = weeksAgainstLimit(calendar.weeks, weeklyLimit);
  const weight = weightMonthStats(weights);
  const currentMonth = parsed.year === today.year && parsed.month === today.month;
  const empty = calendar.monthTotalKcal === 0 && !weight && diaries.length === 0;
  const trend = buildMonthTrend({
    year: parsed.year,
    month: parsed.month,
    calories: records,
    weights,
    goal: goal
      ? {
          currentWeightKg: goal.currentWeightKg,
          targetWeightKg: goal.targetWeightKg,
          weeklyKcal: goal.weeklyKcal,
        }
      : null,
    today: today.date,
    axis,
  });
  const prev = addMonths(parsed.year, parsed.month, -1);
  const next = addMonths(parsed.year, parsed.month, 1);
  const nextIsFuture = next.year > today.year || (next.year === today.year && next.month > today.month);

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10">
      <main className="w-full max-w-2xl overflow-x-hidden rounded-3xl bg-[#F3EBDD] p-4 shadow-sm sm:p-8">
        <InstantLink href={`/?month=${parsed.key}`} className={navQuiet}>
          カレンダーに戻る
        </InstantLink>
        <p className="mt-4 text-sm font-medium text-[#F5821F]">月のまとめ</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <InstantLink
            href={`/months/${formatMonthParam(prev.year, prev.month)}`}
            className="inline-flex min-h-11 items-center text-sm text-[#F5821F]"
          >
            ← 前の月
          </InstantLink>
          <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-950">
            {parsed.year}年{parsed.month}月
          </h1>
          {nextIsFuture ? (
            <span className="inline-flex min-h-11 items-center text-sm text-zinc-400">次の月</span>
          ) : (
            <InstantLink
              href={`/months/${formatMonthParam(next.year, next.month)}`}
              className="inline-flex min-h-11 items-center text-sm text-[#F5821F]"
            >
              次の月 →
            </InstantLink>
          )}
        </div>

        {empty ? <p className="mt-8 text-sm leading-6 text-zinc-700">この月の記録はありません</p> : null}

        {!empty ? (
          <>
            <section className="mt-6 rounded-2xl bg-[#E7DCC8] p-4">
              <h2 className="text-sm font-medium text-zinc-950">カロリー</h2>
              <dl className="mt-3 space-y-2 text-sm leading-6 text-zinc-800">
                <div className="flex justify-between gap-3">
                  <dt>記録した日数</dt>
                  <dd className="font-mono tabular-nums">{formatKcalAmount(recorded.count)}日</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>1日平均{currentMonth ? "（今日は含みません）" : ""}</dt>
                  <dd className="font-mono tabular-nums">
                    {recorded.average == null ? "—" : formatKcal(recorded.average)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>月の合計</dt>
                  <dd className="font-mono tabular-nums">{formatKcal(calendar.monthTotalKcal)}</dd>
                </div>
              </dl>
              {weeks.rows.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-zinc-800">
                    上限以内だった週: <span className="font-mono tabular-nums">{weeks.withinCount}</span>週
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-zinc-700">
                    {weeks.rows.map((row) => (
                      <li key={row.label} className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                        <span>{row.label}</span>
                        <span className="text-right font-mono tabular-nums">
                          {formatKcal(row.total)} / {formatKcal(weeklyLimit)} {row.within ? "以内" : "超え"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">月をまたぐ週は、この月の分だけを足しています。</p>
                </div>
              ) : null}
            </section>

            <section className="mt-4 rounded-2xl bg-[#E7DCC8] p-4">
              <h2 className="text-sm font-medium text-zinc-950">体重</h2>
              {weight ? (
                <dl className="mt-3 space-y-2 text-sm leading-6 text-zinc-800">
                  <div className="flex justify-between gap-3">
                    <dt>最初</dt>
                    <dd className="font-mono tabular-nums">{formatKg(weight.first.weightKg)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>最後</dt>
                    <dd className="font-mono tabular-nums">{formatKg(weight.last.weightKg)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>最小 / 最大</dt>
                    <dd className="font-mono tabular-nums">
                      {formatKg(weight.min)} / {formatKg(weight.max)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>変化</dt>
                    <dd className="font-mono tabular-nums">{formatChange(weight.change)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-zinc-700">記録がありません</p>
              )}
            </section>

            <div className="mt-4">
              <MonthTrendChart model={trend} />
            </div>

            <section className="mt-4">
              <h2 className="text-sm font-medium text-zinc-950">日記</h2>
              {diaries.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-700">この月の日記はありません</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {diaries.map((entry) => (
                    <li key={entry.date}>
                      <InstantLink
                        href={`/days/${entry.date}`}
                        className="block rounded-2xl bg-[#E7DCC8] p-4 text-zinc-900"
                      >
                        <p className="text-sm font-medium text-[#F5821F]">{formatJapaneseDate(entry.date)}</p>
                        <p className="mt-2 text-sm leading-6 break-words">{entry.body}</p>
                        {entry.aiReply ? (
                          <p className="mt-2 text-sm leading-6 break-words text-zinc-700">{entry.aiReply}</p>
                        ) : null}
                      </InstantLink>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={`/months/${parsed.key}/csv?kind=daily`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#F5821F] px-4 text-sm font-medium text-white"
          >
            日ごとの集計
          </a>
          <a
            href={`/months/${parsed.key}/csv?kind=meals`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F5821F] px-4 text-sm font-medium text-[#F5821F]"
          >
            食事の明細
          </a>
        </div>
        <SiteFooter className="mt-10" />
      </main>
    </div>
  );
}
