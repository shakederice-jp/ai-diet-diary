import { InstantLink } from "@/components/instant-link";
import { navIcon } from "@/components/nav-styles";
import {
  addMonths,
  formatKcal,
  formatKcalAmount,
  formatMonthParam,
  type MonthCalendarModel,
} from "@/lib/calendar";

const kcalFigure = "font-mono tabular-nums slashed-zero";
const orangeBox = `rounded-lg border-2 border-[#F5821F] bg-[#FBF6EE] px-0.5 py-1.5 text-center text-[11px] font-semibold leading-tight text-[#F5821F] sm:text-xs ${kcalFigure}`;

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
  weeklyGoal: number;
  today: { year: number; month: number; date: string };
};

function monthHref(year: number, month: number, today: { year: number; month: number }) {
  if (year === today.year && month === today.month) {
    return "/";
  }
  return `/?month=${formatMonthParam(year, month)}`;
}

export function MonthCalendar({
  model,
  weeklyGoal,
  today,
}: MonthCalendarProps) {
  const previous = addMonths(model.year, model.month, -1);
  const next = addMonths(model.year, model.month, 1);
  const averageLabel = model.averageKcal === null ? "—" : formatKcal(model.averageKcal);
  const dailyGoal = weeklyGoal / 7;

  return (
    <section className="w-full rounded-3xl bg-[#F3EBDD] p-3 shadow-sm sm:p-6">
      <div className="flex justify-end">
        <InstantLink
          href="/mypage"
          className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#F5821F] bg-[#FBF6EE] px-5 text-base font-medium text-[#F5821F] hover:bg-[#E7DCC8]"
        >
          マイページ
        </InstantLink>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1 sm:gap-3">
          <InstantLink
            href={monthHref(previous.year, previous.month, today)}
            className={navIcon}
            aria-label="前の月"
          >
            ‹
          </InstantLink>
          <h1 className="text-3xl font-semibold tracking-tight text-[#F5821F]">
            {model.title}
          </h1>
          <InstantLink
            href={monthHref(next.year, next.month, today)}
            className={navIcon}
            aria-label="次の月"
          >
            ›
          </InstantLink>
        </div>
        <p className="flex items-baseline gap-1.5">
          <span className="text-sm text-[#8A7360]">月平均</span>
          <span className={`text-[17px] font-medium text-zinc-900 ${kcalFigure}`}>{averageLabel}</span>
        </p>
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
                      <InstantLink
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
                        {day.steps == null ? null : (
                          <span
                            className={
                              day.date === today.date
                                ? "mt-0.5 text-[9px] leading-none text-white"
                                : "mt-0.5 text-[9px] leading-none text-zinc-500"
                            }
                          >
                            {formatKcalAmount(day.steps)}歩
                          </span>
                        )}
                      </InstantLink>
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
