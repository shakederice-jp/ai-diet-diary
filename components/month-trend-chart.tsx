"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { InstantLink } from "@/components/instant-link";
import { formatKcal, formatKcalAmount } from "@/lib/calendar";
import {
  formatAxisKg,
  formatRecordedKg,
  showDayLabel,
  type MonthTrendDay,
  type MonthTrendModel,
  type MonthTrendScale,
} from "@/lib/month-trend";
import { isWeightOutsideRange, weightPlotFraction } from "@/lib/weight-axis";

const PAD_L = 46;
const PAD_R = 8;
const PAD_T = 18;
const WEIGHT_H = 116;
const GAP = 22;
const CAL_H = 104;
const AXIS_H = 20;
const HEIGHT = PAD_T + WEIGHT_H + GAP + CAL_H + AXIS_H;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const LINE = "#9A3412";
const BAR_UNDER = "#F4A259";
const BAR_OVER = "#C4622D";
const GOAL = "#E2B48C";
const GOAL_TEXT = "#C48A62";
const AXIS = "#8A7360";
const PLOT = "#FBF6EE";

function weekdayOf(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
}

function dayReadout(day: MonthTrendDay) {
  const weight = day.weightKg == null ? "—" : formatRecordedKg(day.weightKg);
  const kcal = day.kcal == null ? "—" : formatKcal(day.kcal);
  return `${day.day}日（${weekdayOf(day.date)}）　体重 ${weight}　カロリー ${kcal}`;
}

function yFor(value: number, scale: MonthTrendScale, top: number, height: number) {
  const span = scale.max - scale.min || 1;
  const clamped = Math.min(scale.max, Math.max(scale.min, value));
  return top + (1 - (clamped - scale.min) / span) * height;
}

function yForWeight(value: number, scale: MonthTrendScale, top: number, height: number) {
  return top + (1 - weightPlotFraction(value, scale.min, scale.max)) * height;
}

function annotationY(y: number, top: number, bottom: number) {
  if (y < top + 16) {
    return y + 12;
  }
  if (y > bottom - 16) {
    return y - 12;
  }
  return y - 11;
}

export function MonthTrendChart({ model }: { model: MonthTrendModel }) {
  if (!model.hasData) {
    return (
      <section
        className="w-full rounded-3xl bg-[#F3EBDD] p-3 shadow-sm sm:p-6"
        data-trend-chart="empty"
        data-month={`${model.year}-${String(model.month).padStart(2, "0")}`}
      >
        <h2 className="text-sm font-medium text-[#F5821F]">体重とカロリー</h2>
        <p className="px-3 py-10 text-center text-sm leading-6 text-zinc-600">
          この月の記録はまだありません
        </p>
      </section>
    );
  }

  return <TrendFigure key={`${model.year}-${model.month}`} model={model} />;
}

function TrendFigure({ model }: { model: MonthTrendModel }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) {
      return;
    }
    const update = () => {
      const next = Math.floor(element.clientWidth);
      if (next > 0) {
        setWidth(next);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    const count = model.days.length;
    setSelected((current) => {
      const base = current ?? (model.todayIndex >= 0 ? model.todayIndex : 0);
      if (event.key === "Home") {
        return 0;
      }
      if (event.key === "End") {
        return count - 1;
      }
      if (event.key === "ArrowLeft") {
        return Math.max(0, base - 1);
      }
      return Math.min(count - 1, base + 1);
    });
  }

  const selectedDay = selected == null ? null : (model.days[selected] ?? null);
  const plotW = width == null ? 0 : Math.max(width - PAD_L - PAD_R, 1);
  const slot = model.days.length > 0 ? plotW / model.days.length : plotW;
  const weightTop = PAD_T;
  const calTop = PAD_T + WEIGHT_H + GAP;
  const calBottom = calTop + CAL_H;
  const clipId = `trend-cal-${model.year}-${model.month}`;
  const weightClipId = `trend-weight-${model.year}-${model.month}`;

  function xAt(index: number) {
    return PAD_L + (index + 0.5) * slot;
  }

  function selectFromPointer(event: PointerEvent<SVGRectElement>, index: number) {
    if (event.pointerType === "mouse") {
      setSelected(index);
    }
  }

  const weightPoints =
    width == null || !model.weight
      ? []
      : model.days.flatMap((day, index) =>
          day.weightKg == null
            ? []
            : [
                {
                  index,
                  x: xAt(index),
                  y: yForWeight(day.weightKg, model.weight!, weightTop, WEIGHT_H),
                  outside: isWeightOutsideRange(day.weightKg, model.weight!.min, model.weight!.max),
                },
              ],
        );

  return (
    <section
      className="w-full rounded-3xl bg-[#F3EBDD] p-3 shadow-sm select-none sm:p-6"
      aria-label={`${model.year}年${model.month}月の体重とカロリー`}
      data-trend-chart="ready"
      data-month={`${model.year}-${String(model.month).padStart(2, "0")}`}
      data-goal-set={model.goalSet ? "true" : "false"}
      data-weight-min={model.weight?.min ?? ""}
      data-weight-max={model.weight?.max ?? ""}
      data-calorie-min={model.calories?.min ?? ""}
      data-calorie-max={model.calories?.max ?? ""}
      data-weight-goal={model.weight?.goal ?? ""}
      data-calorie-goal={model.calories?.goal ?? ""}
      data-weight-outside={model.weightOutside ? "true" : "false"}
    >
      <h2 className="text-sm font-medium text-[#F5821F]">体重とカロリー</h2>
      <p className="mt-1 text-[11px] leading-4 text-[#8A7360]">上段 体重（kg） / 下段 摂取カロリー</p>
      {model.weightOutside ? (
        <p className="mt-1 text-[11px] leading-4 text-[#8A7360]" data-weight-outside-note="">
          範囲外の日があります
        </p>
      ) : null}
      <div
        ref={frame}
        tabIndex={0}
        role="group"
        aria-label="日付を押すと、その日の体重とカロリーを表示します"
        onKeyDown={onKeyDown}
        className="mt-3 w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F]/40"
        style={{ touchAction: "manipulation" }}
      >
        {width == null ? (
          <div style={{ height: HEIGHT }} />
        ) : (
          <svg
            role="img"
            aria-label={`${model.year}年${model.month}月の体重の折れ線と、摂取カロリーの棒グラフ`}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            width={width}
            height={HEIGHT}
            className="block max-w-full cursor-pointer"
            style={{ fontFamily: "inherit" }}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={PAD_L} y={calTop} width={plotW} height={CAL_H} />
              </clipPath>
              <clipPath id={weightClipId}>
                <rect x={PAD_L} y={weightTop} width={plotW} height={WEIGHT_H} />
              </clipPath>
            </defs>
            <rect x={PAD_L} y={weightTop} width={plotW} height={WEIGHT_H} fill={PLOT} />
            <rect x={PAD_L} y={calTop} width={plotW} height={CAL_H} fill={PLOT} />
            {selected != null ? (
              <rect
                x={PAD_L + selected * slot}
                y={weightTop}
                width={slot}
                height={calBottom - weightTop}
                fill="#F5821F"
                opacity={0.12}
              />
            ) : null}
            {model.weight
              ? model.weight.ticks.map((tick) => {
                  const y = yFor(tick, model.weight!, weightTop, WEIGHT_H);
                  return (
                    <g key={`w-${tick}`}>
                      <line
                        x1={PAD_L}
                        x2={PAD_L + plotW}
                        y1={y}
                        y2={y}
                        stroke="#E7DCC8"
                        strokeWidth={1}
                      />
                      <text
                        x={PAD_L - 6}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fill={AXIS}
                        fontSize={10}
                      >
                        {formatAxisKg(tick)}
                      </text>
                    </g>
                  );
                })
              : (
                <text
                  x={PAD_L + plotW / 2}
                  y={weightTop + WEIGHT_H / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={AXIS}
                  fontSize={12}
                >
                  この月の体重記録はありません
                </text>
              )}
            {model.weight?.goal != null ? (
              <g>
                <line
                  x1={PAD_L}
                  x2={PAD_L + plotW}
                  y1={yFor(model.weight.goal, model.weight, weightTop, WEIGHT_H)}
                  y2={yFor(model.weight.goal, model.weight, weightTop, WEIGHT_H)}
                  stroke={GOAL}
                  strokeWidth={1.25}
                  strokeDasharray="4 3"
                />
                <text
                  x={PAD_L + plotW - 4}
                  y={annotationY(
                    yFor(model.weight.goal, model.weight, weightTop, WEIGHT_H),
                    weightTop,
                    weightTop + WEIGHT_H,
                  )}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={GOAL_TEXT}
                  fontSize={10}
                  stroke={PLOT}
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {`目標${formatAxisKg(model.weight.goal)}kg`}
                </text>
              </g>
            ) : null}
            {weightPoints.length > 1 ? (
              <polyline
                points={weightPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke={LINE}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                clipPath={model.weightOutside ? `url(#${weightClipId})` : undefined}
              />
            ) : null}
            {weightPoints.map((point) =>
              point.outside ? null : (
                <circle
                  key={`p-${point.index}`}
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  fill={LINE}
                  stroke={PLOT}
                  strokeWidth={1.5}
                />
              ),
            )}
            {model.calories ? (
              <g>
                {model.calories.ticks.map((tick) => {
                  const y = yFor(tick, model.calories!, calTop, CAL_H);
                  return (
                    <g key={`c-${tick}`}>
                      <line
                        x1={PAD_L}
                        x2={PAD_L + plotW}
                        y1={y}
                        y2={y}
                        stroke="#E7DCC8"
                        strokeWidth={1}
                      />
                      <text
                        x={PAD_L - 6}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fill={AXIS}
                        fontSize={10}
                      >
                        {formatKcalAmount(tick)}
                      </text>
                    </g>
                  );
                })}
                <g clipPath={`url(#${clipId})`}>
                  {model.days.map((day, index) => {
                    if (day.kcal == null || !model.calories) {
                      return null;
                    }
                    const bottom = calTop + CAL_H;
                    const yValue = yFor(day.kcal, model.calories, calTop, CAL_H);
                    const barH = Math.max(bottom - yValue, 2);
                    const barW = Math.max(1.5, Math.min(14, slot * 0.52));
                    const over = model.calories.goal != null && day.kcal > model.calories.goal;
                    return (
                      <rect
                        key={day.date}
                        x={xAt(index) - barW / 2}
                        y={bottom - barH}
                        width={barW}
                        height={barH}
                        fill={over ? BAR_OVER : BAR_UNDER}
                        rx={1.5}
                      />
                    );
                  })}
                </g>
              </g>
            ) : (
              <text
                x={PAD_L + plotW / 2}
                y={calTop + CAL_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={AXIS}
                fontSize={12}
              >
                この月のカロリー記録はありません
              </text>
            )}
            {model.calories?.goal != null ? (
              <g>
                <line
                  x1={PAD_L}
                  x2={PAD_L + plotW}
                  y1={yFor(model.calories.goal, model.calories, calTop, CAL_H)}
                  y2={yFor(model.calories.goal, model.calories, calTop, CAL_H)}
                  stroke={GOAL}
                  strokeWidth={1.25}
                  strokeDasharray="4 3"
                />
                <text
                  x={PAD_L + plotW - 4}
                  y={annotationY(
                    yFor(model.calories.goal, model.calories, calTop, CAL_H),
                    calTop,
                    calTop + CAL_H,
                  )}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={GOAL_TEXT}
                  fontSize={10}
                  stroke={PLOT}
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {`目標${formatKcal(model.calories.goal)}`}
                </text>
              </g>
            ) : null}
            {model.todayIndex >= 0 ? (
              <line
                x1={xAt(model.todayIndex)}
                x2={xAt(model.todayIndex)}
                y1={weightTop}
                y2={calBottom}
                stroke="#F5821F"
                strokeOpacity={0.55}
                strokeWidth={1.5}
              />
            ) : null}
            {model.days.map((day, index) =>
              showDayLabel(day.day) ? (
                <text
                  key={`d-${day.date}`}
                  x={xAt(index)}
                  y={calBottom + 14}
                  textAnchor="middle"
                  fill={selected === index ? "#F5821F" : AXIS}
                  fontSize={11}
                  fontWeight={selected === index ? 600 : 400}
                >
                  {day.day}
                </text>
              ) : null,
            )}
            {model.days.map((day, index) => (
              <rect
                key={`hit-${day.date}`}
                x={PAD_L + index * slot}
                y={weightTop}
                width={slot}
                height={calBottom - weightTop + AXIS_H}
                fill="transparent"
                onPointerEnter={(event) => selectFromPointer(event, index)}
                onClick={() => setSelected(index)}
              >
                <title>
                  {day.day}日 体重 {day.weightKg == null ? "記録なし" : formatRecordedKg(day.weightKg)}{" "}
                  カロリー {day.kcal == null ? "記録なし" : formatKcal(day.kcal)}
                </title>
              </rect>
            ))}
          </svg>
        )}
      </div>
      <p aria-live="polite" data-trend-readout="" className="mt-2 min-h-6 text-center text-sm leading-6 text-zinc-800">
        {selectedDay ? (
          dayReadout(selectedDay)
        ) : (
          <span className="text-[11px] text-zinc-500">
            日付を押すと、その日の体重とカロリーを表示します
          </span>
        )}
      </p>
      {model.goalSet ? (
        <p className="mt-1 text-center text-[11px] leading-5 text-zinc-500">
          目盛りは見やすいように調整しています
        </p>
      ) : (
        <p className="mt-1 text-center text-[11px] leading-5">
          <InstantLink href="/goals" className="text-[#F5821F] underline decoration-[#F5821F]/40">
            目標を設定すると、見やすい目盛りになります
          </InstantLink>
        </p>
      )}
    </section>
  );
}
