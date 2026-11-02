import { SampleFrame } from "@/components/guide/sample-frame";
import { getAdvisor, ADVISOR_DISCLAIMER } from "@/lib/advisors";
import { formatKcal } from "@/lib/calendar";
import {
  GUIDE_SAMPLE_ADVISOR_ID,
  GUIDE_SAMPLE_ADVISOR_TEXT,
  GUIDE_SAMPLE_CALENDAR,
  GUIDE_SAMPLE_DIARY,
  GUIDE_SAMPLE_HEALTH,
  GUIDE_SAMPLE_LABELS,
  GUIDE_SAMPLE_MEALS,
  GUIDE_SAMPLE_VOICE,
  GUIDE_SAMPLE_WEEKLY_LIMIT,
  GUIDE_SAMPLE_WEEKLY_TOTAL,
  GUIDE_SAMPLE_WEIGHTS,
  type GuideFeatureId,
} from "@/lib/guide-lp";
import { weeklyLimitDisplay } from "@/lib/weekly-limit-display";

const kcalFigure = "font-mono tabular-nums slashed-zero";

export function GuideSample({ id }: { id: GuideFeatureId }) {
  if (id === "meals") {
    return <SampleMeals />;
  }
  if (id === "health") {
    return <SampleHealth />;
  }
  if (id === "weight") {
    return <SampleWeight />;
  }
  if (id === "weekly") {
    return <SampleWeekly />;
  }
  if (id === "advisor") {
    return <SampleAdvisor />;
  }
  if (id === "voice") {
    return <SampleVoice />;
  }
  return <SampleDiary />;
}

function SampleMeals() {
  return (
    <SampleFrame label={GUIDE_SAMPLE_LABELS.meals}>
      <div className="flex flex-col gap-4">
        {GUIDE_SAMPLE_MEALS.map((group) => {
          const total = group.items.reduce((sum, item) => sum + item.kcal, 0);
          return (
            <section key={group.period}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-medium text-zinc-950">{group.period}</p>
                <p className={`rounded-full bg-[#F27A1A] px-2.5 py-1 text-sm font-bold text-white ${kcalFigure}`}>
                  {formatKcal(total)}
                </p>
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {group.items.map((item) => (
                  <li
                    key={`${group.period}-${item.name}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2"
                  >
                    <span className="text-base text-zinc-900">{item.name}</span>
                    <span className="shrink-0 text-right text-sm text-zinc-600">
                      <span className={kcalFigure}>{formatKcal(item.kcal)}</span>
                      <span className="ml-2 text-xs text-[#8A7360]">{item.source}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </SampleFrame>
  );
}

function SampleHealth() {
  return (
    <SampleFrame label={GUIDE_SAMPLE_LABELS.health}>
      <p className="text-sm font-medium text-[#F27A1A]">外部サービス連携</p>
      <p className="mt-1 text-base text-zinc-800">Health Planet: 連携済み</p>
      <ul className="mt-3 flex flex-col gap-2">
        {GUIDE_SAMPLE_HEALTH.map((row) => (
          <li key={row.when} className="rounded-xl bg-white px-3 py-2">
            <p className="text-sm text-[#8A7360]">{row.when}</p>
            <p className="mt-1 flex items-baseline justify-between gap-2">
              <span className={`text-lg font-medium text-zinc-950 ${kcalFigure}`}>{row.value}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  row.source === "Health Planet" ? "bg-[#F27A1A] text-white" : "bg-[#E7DCC8] text-[#6B4A32]"
                }`}
              >
                {row.source}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </SampleFrame>
  );
}

function SampleWeight() {
  const values = GUIDE_SAMPLE_WEIGHTS;
  const min = 61.8;
  const max = 64.2;
  const left = 42;
  const top = 10;
  const plotW = 268;
  const plotH = 108;
  const step = plotW / (values.length - 1);
  const points = values.map((value, index) => {
    const x = left + index * step;
    const y = top + (1 - (value - min) / (max - min)) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const yFor = (value: number) => top + (1 - (value - min) / (max - min)) * plotH;
  const ticks = [64, 63, 62];

  return (
    <SampleFrame label={GUIDE_SAMPLE_LABELS.weight}>
      <p className="text-sm font-medium text-[#F27A1A]">サンプルの週</p>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {GUIDE_SAMPLE_CALENDAR.map((day) => (
          <div
            key={day.label}
            className={`rounded-lg px-0.5 py-1.5 text-center ${
              day.tone === "today" ? "bg-[#F27A1A] text-white" : day.tone === "over" ? "bg-[#FFD7B0] text-zinc-900" : "bg-white text-zinc-800"
            }`}
          >
            <p className="text-[11px]">{day.label}</p>
            <p className={`text-[10px] leading-4 ${kcalFigure}`}>{day.kcal}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-medium text-[#F27A1A]">体重の推移（28週）</p>
      <svg viewBox="0 0 320 150" className="mt-2 h-auto w-full">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={left + plotW} y1={yFor(tick)} y2={yFor(tick)} stroke="#E4D7C6" strokeWidth="1" />
            <text x={left - 6} y={yFor(tick) + 4} textAnchor="end" fill="#8A7360" fontSize="10">
              {tick}
            </text>
          </g>
        ))}
        <polyline points={points.join(" ")} fill="none" stroke="#F27A1A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {[0, 7, 14, 21, 27].map((index) => (
          <text key={index} x={left + index * step} y="146" textAnchor="middle" fill="#8A7360" fontSize="10">
            {index + 1}週
          </text>
        ))}
      </svg>
    </SampleFrame>
  );
}

function SampleWeekly() {
  const view = weeklyLimitDisplay(GUIDE_SAMPLE_WEEKLY_TOTAL, GUIDE_SAMPLE_WEEKLY_LIMIT);
  const marker = `${view.markerPercent}%`;
  return (
    <SampleFrame label={GUIDE_SAMPLE_LABELS.weekly}>
      <p className="text-sm text-zinc-700">今週の上限</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={`text-2xl font-semibold text-zinc-950 ${kcalFigure}`}>{formatKcal(GUIDE_SAMPLE_WEEKLY_LIMIT)}</span>
        <span className="text-sm text-zinc-600">以内</span>
      </p>
      <div className="relative mt-4 pt-4">
        <span className="absolute top-0 -translate-x-1/2 text-[11px] text-zinc-600" style={{ left: marker }}>
          上限
        </span>
        <div className="relative h-3 overflow-hidden rounded-full bg-white">
          <div className="absolute inset-y-0 left-0 bg-[#F27A1A]" style={{ width: `${view.orangePercent}%` }} />
          <div className="absolute inset-y-0 bg-[#B5472B]" style={{ left: marker, width: `${view.redPercent}%` }} />
          <div className="absolute inset-y-0 w-px bg-[#5C4033]" style={{ left: marker }} />
        </div>
      </div>
      <p className={`mt-2 text-right text-xs text-zinc-600 ${kcalFigure}`}>上限の{view.percent}%</p>
      <p className={`mt-2 text-base text-zinc-800 ${kcalFigure}`}>今週の合計 {formatKcal(GUIDE_SAMPLE_WEEKLY_TOTAL)}</p>
      <p className={`text-base text-[#B5472B] ${kcalFigure}`}>上限を {formatKcal(view.excess)} 超えています</p>
    </SampleFrame>
  );
}

function SampleAdvisor() {
  const advisor = getAdvisor(GUIDE_SAMPLE_ADVISOR_ID);
  return (
    <SampleFrame label={GUIDE_SAMPLE_LABELS.advisor}>
      <p className="text-sm font-medium text-[#F27A1A]">健康アドバイザーAI</p>
      <p className="mt-1 text-base font-medium text-zinc-950">{advisor.name}</p>
      <p className="mt-1 text-sm leading-6 text-[#6B4A32]">{advisor.description}</p>
      <p className="mt-3 rounded-xl bg-white px-3 py-3 text-base leading-7 text-zinc-800">{GUIDE_SAMPLE_ADVISOR_TEXT}</p>
      <p className="mt-3 text-xs leading-5 text-zinc-600">{ADVISOR_DISCLAIMER}</p>
    </SampleFrame>
  );
}

function SampleVoice() {
  return (
    <SampleFrame label={GUIDE_SAMPLE_LABELS.voice}>
      <div className="flex items-center gap-2">
        <p className="text-base font-medium text-zinc-950">{GUIDE_SAMPLE_VOICE.period}</p>
        <span className="ml-auto inline-flex size-11 items-center justify-center rounded-full border border-[#E4D7C6] bg-white">
          <svg viewBox="0 0 24 24" className="size-5 text-[#F27A1A]" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
            />
          </svg>
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-[#E4D7C6] bg-white px-3 text-base text-zinc-900">
          {GUIDE_SAMPLE_VOICE.name}
        </div>
        <div className="flex h-12 w-[5.5rem] items-center rounded-xl border border-[#E4D7C6] bg-white px-2 text-sm text-zinc-400">
          kcal
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{GUIDE_SAMPLE_VOICE.hint}</p>
      <div className="mt-4 flex min-h-[52px] items-center justify-center rounded-full bg-[#F27A1A] px-6 text-base font-medium text-white">
        まとめて登録
      </div>
    </SampleFrame>
  );
}

function SampleDiary() {
  const advisor = getAdvisor(GUIDE_SAMPLE_ADVISOR_ID);
  const within = GUIDE_SAMPLE_DIARY.weeks.filter((week) => week.within).length;
  return (
    <SampleFrame label={GUIDE_SAMPLE_LABELS.diary}>
      <p className="text-sm font-medium text-[#F27A1A]">今日のひとこと</p>
      <p className="mt-2 rounded-xl bg-white px-3 py-3 text-base leading-7 text-zinc-900">{GUIDE_SAMPLE_DIARY.body}</p>
      <p className="mt-2 text-sm text-[#6B4A32]">{advisor.name}</p>
      <p className="mt-1 text-base leading-7 text-zinc-700">{GUIDE_SAMPLE_DIARY.reply}</p>
      <div className="mt-4 rounded-xl bg-white p-3">
        <p className="text-sm font-medium text-zinc-950">サンプルの月</p>
        <p className="mt-2 text-sm text-zinc-800">
          上限以内だった週: <span className={kcalFigure}>{within}</span>週
        </p>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-zinc-700">
          {GUIDE_SAMPLE_DIARY.weeks.map((week) => (
            <li key={week.label} className="flex justify-between gap-3">
              <span>{week.label}</span>
              <span className={kcalFigure}>
                {formatKcal(week.total)} / {formatKcal(GUIDE_SAMPLE_WEEKLY_LIMIT)} {week.within ? "以内" : "超え"}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 text-sm leading-6 text-zinc-800">
          <div className="flex justify-between gap-3">
            <dt>最初</dt>
            <dd className={kcalFigure}>{GUIDE_SAMPLE_DIARY.weight.first}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>最後</dt>
            <dd className={kcalFigure}>{GUIDE_SAMPLE_DIARY.weight.last}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>最小 / 最大</dt>
            <dd className={kcalFigure}>
              {GUIDE_SAMPLE_DIARY.weight.min} / {GUIDE_SAMPLE_DIARY.weight.max}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>変化</dt>
            <dd className={kcalFigure}>{GUIDE_SAMPLE_DIARY.weight.change}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex min-h-11 items-center justify-center rounded-full bg-[#F27A1A] text-sm font-medium text-white">
            日ごとの集計
          </div>
          <div className="flex min-h-11 items-center justify-center rounded-full border border-[#F27A1A] text-sm font-medium text-[#F27A1A]">
            食事の明細
          </div>
        </div>
      </div>
    </SampleFrame>
  );
}
