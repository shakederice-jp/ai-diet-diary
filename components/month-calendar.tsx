import Link from "next/link";
import { setWeekStart } from "@/app/calendar/actions";
import {
  addMonths,
  formatKcal,
  formatMonthParam,
  type MonthCalendarModel,
  type WeekStart,
} from "@/lib/calendar";

const kcalFigure = "font-mono tabular-nums slashed-zero";
const orangeBox = `rounded-lg border-2 border-[#F5821F] px-1 py-2 text-center text-xs font-semibold text-[#F5821F] sm:text-sm ${kcalFigure}`;

type MonthCalendarProps = {
  model: MonthCalendarModel;
  weekStartsOn: WeekStart;
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
  today,
  preserved,
}: MonthCalendarProps) {
  const previous = addMonths(model.year, model.month, -1);
  const next = addMonths(model.year, model.month, 1);
  const averageLabel =
    model.averageKcal === null ? "平均 —" : `平均 ${formatKcal(model.averageKcal)}`;

  return (
    <section className="w-full rounded-3xl bg-white p-4 shadow-sm sm:p-6 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={monthHref(previous.year, previous.month, today, preserved)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#F5821F] hover:bg-[#FFF4EB]"
            aria-label="前の月"
          >
            ‹
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[#F5821F]">
            {model.title}
          </h1>
          <span
            className={`inline-flex items-center rounded-full border-2 border-[#F5821F] px-3 py-1 text-sm font-semibold text-[#F5821F] ${kcalFigure}`}
          >
            {averageLabel}
          </span>
          <Link
            href={monthHref(next.year, next.month, today, preserved)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#F5821F] hover:bg-[#FFF4EB]"
            aria-label="次の月"
          >
            ›
          </Link>
        </div>

        <form action={setWeekStart} className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">週の始まり</span>
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
                    : "rounded-full border border-[#F5821F] px-3 py-1.5 text-sm font-medium text-[#F5821F] hover:bg-[#FFF4EB]"
                }
              >
                {value === "sunday" ? "日曜" : "月曜"}
              </button>
            );
          })}
        </form>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-1">
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
                className="pb-2 text-center text-sm font-medium text-[#F5821F]"
              >
                週計
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
                            ? "flex min-h-20 flex-col rounded-xl bg-[#FFF4EB] px-2 py-2 ring-2 ring-[#F5821F] hover:bg-[#FFE8D4]"
                            : "flex min-h-20 flex-col rounded-xl px-2 py-2 hover:bg-[#FFF4EB]"
                        }
                      >
                        <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {day.day}
                        </span>
                        <span
                          className={`mt-auto text-xs text-zinc-600 dark:text-zinc-400 ${kcalFigure}`}
                        >
                          {formatKcal(day.kcal)}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex min-h-20 flex-col px-2 py-2">
                        <span className="text-sm text-zinc-300 dark:text-zinc-700">
                          {day.day}
                        </span>
                      </div>
                    )}
                  </td>
                ))}
                <td className="align-middle">
                  <div className={orangeBox}>{formatKcal(week.totalKcal)}</div>
                </td>
              </tr>
            ))}
            <tr>
              {model.weekdayTotals.map((total, index) => (
                <td key={model.weekdayLabels[index]}>
                  <div className={orangeBox} aria-label={`${model.weekdayLabels[index]}曜日の累計`}>
                    {formatKcal(total)}
                  </div>
                </td>
              ))}
              <td>
                <div className={orangeBox} aria-label="月間合計">
                  {formatKcal(model.monthTotalKcal)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
