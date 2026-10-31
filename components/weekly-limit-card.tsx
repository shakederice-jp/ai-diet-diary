import { InstantLink } from "@/components/instant-link";
import { formatKcal } from "@/lib/calendar";
import { weeklyLimitDisplay } from "@/lib/weekly-limit-display";

const kcalFigure = "font-mono tabular-nums slashed-zero";

export function WeeklyLimitCard({ weekTotal, limit }: { weekTotal: number; limit: number }) {
  const view = weeklyLimitDisplay(weekTotal, limit);
  const marker = `${view.markerPercent}%`;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm whitespace-nowrap text-zinc-700">今週の上限</p>
        <InstantLink
          href="/goals"
          className="inline-flex min-h-11 shrink-0 items-center px-1 text-sm whitespace-nowrap text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4"
        >
          上限を変える
        </InstantLink>
      </div>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={`text-2xl font-semibold whitespace-nowrap text-zinc-950 ${kcalFigure}`}>
          {formatKcal(limit)}
        </span>
        <span className="text-xs whitespace-nowrap text-zinc-600">以内</span>
      </p>

      <div className="relative mt-4 pt-4">
        <span
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none text-zinc-600"
          style={{ left: marker }}
        >
          上限
        </span>
        <div
          className="relative h-3 overflow-hidden rounded-full bg-white"
          role="img"
          aria-label={`今週の合計 ${formatKcal(weekTotal)}、上限 ${formatKcal(limit)}`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-[#F5821F]"
            style={{ width: `${view.orangePercent}%` }}
          />
          {view.over ? (
            <div
              className="absolute inset-y-0 bg-[#B5472B]"
              style={{ left: marker, width: `${view.redPercent}%` }}
            />
          ) : null}
          <div className="absolute inset-y-0 w-px bg-[#5C4033]" style={{ left: marker }} />
        </div>
      </div>
      <p className={`mt-1 text-right text-xs whitespace-nowrap text-zinc-600 ${kcalFigure}`}>
        上限の{view.percent}%
      </p>
      <p className={`mt-2 text-sm text-zinc-800 ${kcalFigure}`}>
        今週の合計 <span className="whitespace-nowrap">{formatKcal(weekTotal)}</span>
      </p>
      <p className={`text-sm ${view.over ? "text-[#B5472B]" : "text-zinc-700"} ${kcalFigure}`}>
        {view.over ? (
          <>
            上限を <span className="whitespace-nowrap">{formatKcal(view.excess)}</span> 超えています
          </>
        ) : (
          <>
            上限まで あと <span className="whitespace-nowrap">{formatKcal(view.remaining)}</span>
          </>
        )}
      </p>
      {view.near ? <p className="text-sm text-zinc-700">上限まであとわずかです</p> : null}
    </div>
  );
}
