import { formatKcal } from "@/lib/calendar";
import {
  SOURCE_COLORS,
  SNACK_COLOR,
  buildCalorieBand,
  type BandMeal,
  type MealSource,
} from "@/lib/meal-slot";

const BAND_X = 56;
const BAND_WIDTH = 56;
const LABEL_X = 4;
const STACK_RADIUS = 6;
const PERIOD_GAP = "#F3EBDD";

function spacedLabels(
  labels: Array<{ period: string; y: number; height: number }>,
  chartHeight: number,
) {
  const gap = 16;
  const placed = [...labels]
    .sort((left, right) => right.y - left.y)
    .map((label) => ({ ...label, labelY: label.y + label.height / 2 }));

  for (let index = 0; index < placed.length; index += 1) {
    const previous = placed[index - 1];
    if (previous && previous.labelY - placed[index].labelY < gap) {
      placed[index].labelY = previous.labelY - gap;
    }
  }
  for (let index = placed.length - 1; index >= 0; index -= 1) {
    const next = placed[index + 1];
    if (next && placed[index].labelY - next.labelY < gap) {
      placed[index].labelY = next.labelY + gap;
    }
    placed[index].labelY = Math.min(chartHeight - 8, Math.max(8, placed[index].labelY));
  }
  return placed;
}

function periodSeams(labels: Array<{ y: number; height: number }>) {
  const ordered = [...labels].sort((left, right) => left.y - right.y);
  const seams: number[] = [];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const upper = ordered[index];
    const lower = ordered[index + 1];
    if (!upper || !lower) {
      continue;
    }
    seams.push(upper.y + upper.height);
  }
  return seams;
}

export function DailyCalorieBand({
  meals,
  dailyGoal,
}: {
  meals: BandMeal[];
  dailyGoal: number;
}) {
  const band = buildCalorieBand(meals, dailyGoal);
  const width = 220;
  const topPad = 18;
  const labels = spacedLabels(band.labels, band.chartHeight);
  const seams = periodSeams(band.labels);
  const stackTop = band.slices.length === 0 ? 0 : Math.min(...band.slices.map((slice) => slice.y));
  const stackBottom =
    band.slices.length === 0 ? 0 : Math.max(...band.slices.map((slice) => slice.y + slice.height));
  const clipId = "calorie-band-stack";

  return (
    <figure className="mt-6">
      <figcaption className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        時間帯ごとのカロリー
      </figcaption>
      <svg
        role="img"
        aria-label={`1日の目標 ${formatKcal(dailyGoal)} に対する摂取の帯グラフ`}
        width="100%"
        viewBox={`0 ${-topPad} ${width} ${band.chartHeight + topPad}`}
        className="mt-3 max-w-sm"
      >
        <rect
          x={BAND_X}
          y={0}
          width={BAND_WIDTH}
          height={band.chartHeight}
          fill="#FBF6EE"
          stroke="#F5821F"
        />
        <defs>
          <clipPath id={clipId}>
            <rect
              x={BAND_X}
              y={stackTop}
              width={BAND_WIDTH}
              height={Math.max(stackBottom - stackTop, 0)}
              rx={STACK_RADIUS}
              ry={STACK_RADIUS}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {band.slices.map((slice) => (
            <rect
              key={`${slice.period}-${slice.source ?? "snack"}-${slice.y}`}
              x={BAND_X}
              y={slice.y}
              width={BAND_WIDTH}
              height={Math.max(slice.height, 0)}
              fill={slice.color}
            >
              <title>{`${slice.period}${slice.source ? ` ${slice.source}` : ""} ${formatKcal(slice.kcal)}`}</title>
            </rect>
          ))}
        </g>
        {seams.map((y) => (
          <line
            key={y}
            x1={BAND_X}
            x2={BAND_X + BAND_WIDTH}
            y1={y}
            y2={y}
            stroke={PERIOD_GAP}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1={BAND_X - 8}
          x2={BAND_X + BAND_WIDTH + 8}
          y1={band.goalLineY}
          y2={band.goalLineY}
          stroke="#F5821F"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
        <text
          x={BAND_X + BAND_WIDTH + 14}
          y={band.goalLineY}
          dominantBaseline="middle"
          fill="#F5821F"
          fontSize={12}
        >
          目標 {formatKcal(dailyGoal)}
        </text>
        {labels.map((label) => (
          <text
            key={label.period}
            x={LABEL_X}
            y={label.labelY}
            dominantBaseline="middle"
            fill="#F5821F"
            fontSize={13}
          >
            {label.period}
          </text>
        ))}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
        {(Object.entries(SOURCE_COLORS) as Array<[MealSource, string]>).map(([name, color]) => (
          <li key={name} className="flex items-center gap-1">
            <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: color }} />
            {name}
          </li>
        ))}
        <li className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: SNACK_COLOR }} />
          間食
        </li>
      </ul>
    </figure>
  );
}
