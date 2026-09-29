import Link from "next/link";
import { setWeekStart } from "@/app/calendar/actions";
import {
  addMonths,
  formatKcal,
  formatKcalAmount,
  formatMonthParam,
  type MonthCalendarModel,
  type WeekStart,
} from "@/lib/calendar";

const kcalFigure = "font-mono tabular-nums slashed-zero";
const orangeBox = `rounded-lg border-2 border-[#F5821F] bg-[#FBF6EE] px-0.5 py-1.5 text-center text-[11px] font-semibold leading-tight text-[#F5821F] sm:text-xs ${kcalFigure}`;
const orangeBadge = `inline-flex items-center rounded-full border-2 border-[#F5821F] bg-[#FBF6EE] px-3 py-1 text-sm font-semibold text-[#F5821F] ${kcalFigure}`;

function KcalStack({
  value,
  className = "",
}: {
  value: number | null;
  className?: string;
}) {
  if (value === null) {
    return <span className={kcalFigure}>—</span>;
  }

  return (
    <span className={`flex flex-col items-center leading-none ${kcalFigure} ${className}`}>
      <span>{formatKcalAmount(value)}</span>
      <span className="mt-0.5 text-[10px] font-medium leading-none">kcal</span>
    </span>
  );
}

function daySurface(recorded: boolean, kcal: number, dailyGoal: number) {
  if (recorded && dailyGoal > 0 && kcal > dailyGoal) {
    return "bg-[#F6C9A0] hover:bg-[#F0B888]";
  }
  return "bg-[#FBF6EE] hover:bg-[#F3E6D4]";
}

type MonthCalendarProps = {
  model: MonthCalendarModel;
  weekStartsOn: WeekStart;
  weeklyGoal: number;
  today: { year: number; month: number; date: string };
  preserved: {
    healthplanet?: string;
    reason?: string;
  };
};

function monthHref(
  year: number,
  month: number,
  today: { year: number; month: number },
  preserved: MonthCalendarProps["preserved"],
) {
  const search = new URLSearchParams();
  if (!(year === today.year && month === today.month)) {
    search.set("month", formatMonthParam(year, month));
  }
  if (preserved.healthplanet) {
    search.set("healthplanet", preserved.healthplanet);
  }
  if (preserved.reason) {
    search.set("reason", preserved.reason);
  }
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

export function MonthCalendar({
  model,
  weekStartsOn,
  weeklyGoal,
  today,
  preserved,
}: MonthCalendarProps) {
  const previous = addMonths(model.year, model.month, -1);
  const next = addMonths(model.year, model.month, 1);
  const averageLabel =
    model.averageKcal === null ? "平均 —" : `平均 ${formatKcal(model.averageKcal)}`;
  const dailyGoal = weeklyGoal / 7;

  return (
    <section className="w-full rounded-3xl bg-[#F3EBDD] p-3 shadow-sm sm:p-6">
      <div className="flex justify-end">
        <Link
          href="/mypage"
          aria-label="マイページ"
          className="inline-flex size-9 items-center justify-center rounded-full text-[#F5821F] hover:bg-[#E7DCC8]"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5 19.25c1.35-3.1 3.9-4.65 7-4.65s5.65 1.55 7 4.65" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={monthHref(previous.year, previous.month, today, preserved)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#F5821F] hover:bg-[#E7DCC8]"
            aria-label="前の月"
          >
            ‹
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[#F5821F]">
            {model.title}
          </h1>
          <span className={orangeBadge}>{averageLabel}</span>
          <Link
            href={monthHref(next.year, next.month, today, preserved)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#F5821F] hover:bg-[#E7DCC8]"
            aria-label="次の月"
          >
            ›
          </Link>
          <Link href="/goals" className={`${orangeBadge} hover:bg-[#E7DCC8]`}>
            週の目標 {formatKcal(weeklyGoal)}
          </Link>
        </div>

        <form action={setWeekStart} className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">週の始まり</span>
          {(["sunday", "monday"] as const).map((value) => {
            const selected = weekStartsOn === value;
            return (
              <button
                key={value}
                type="submit"
                name="weekStart"
                value={value}
                aria-pressed={selected}
                className={
                  selected
                    ? "rounded-full bg-[#F5821F] px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-full border border-[#F5821F] bg-[#FBF6EE] px-3 py-1.5 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8]"
                }
              >
                {value === "sunday" ? "日曜" : "月曜"}
              </button>
            );
          })}
        </form>
      </div>

      <div className="mt-6">
        <table className="w-full table-fixed border-separate border-spacing-0.5 sm:border-spacing-1">
          <caption className="sr-only">
            {model.year}年{model.month}月の摂取カロリー
          </caption>
          <thead>
            <tr>
              {model.weekdayLabels.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="pb-2 text-center text-sm font-medium text-[#F5821F]"
                >
                  {label}
                </th>
              ))}
              <th
                scope="col"
                className="pb-2 text-center text-xs font-medium text-[#F5821F] sm:text-sm"
              >
                週平均
              </th>
            </tr>
          </thead>
          <tbody>
            {model.weeks.map((week) => (
              <tr key={week.days[0]?.date ?? "week"}>
                {week.days.map((day) => (
                  <td key={day.date} className="align-top">
                    {day.inMonth ? (
                      <Link
                        href={`/days/${day.date}`}
                        className={
                          day.date === today.date
                            ? "flex min-h-16 flex-col items-center rounded-lg bg-[#F5821F] px-0.5 py-1 text-white hover:bg-[#E06E0C]"
                            : `flex min-h-16 flex-col items-center rounded-lg px-0.5 py-1 text-zinc-950 ${daySurface(day.recorded, day.kcal, dailyGoal)}`
                        }
                      >
                        <span className="text-xs font-medium sm:text-sm">{day.day}</span>
                        <span className="mt-auto">
                          <KcalStack
                            value={day.kcal}
                            className={
                              day.date === today.date
                                ? "text-[11px] text-white sm:text-xs"
                                : "text-[11px] text-zinc-700 sm:text-xs"
                            }
                          />
                        </span>
                      </Link>
                    ) : (
                      <div className="flex min-h-16 flex-col items-center px-0.5 py-1">
                        <span className="text-xs text-[#C4B39A] sm:text-sm">{day.day}</span>
                      </div>
                    )}
                  </td>
                ))}
                <td className="align-middle">
                  <div className={orangeBox} aria-label="この週の平均">
                    <KcalStack value={week.averageKcal} />
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              {model.weekdayAverages.map((average, index) => (
                <td key={model.weekdayLabels[index]}>
                  <div className={orangeBox} aria-label={`${model.weekdayLabels[index]}曜日の平均`}>
                    <KcalStack value={average} />
                  </div>
                </td>
              ))}
              <td>
                <div className={orangeBox} aria-label="月間合計">
                  <KcalStack value={model.monthTotalKcal} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
