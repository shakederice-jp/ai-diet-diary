"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { formatKcal, formatKcalAmount } from "@/lib/calendar";
import { formatAxisKg } from "@/lib/month-trend";
import type { TrendPoint, TrendSpanModel } from "@/lib/trend-span";
import { TREND_CHART_HEIGHT } from "@/components/month-trend-chart";

const PAD_L = 46;
const PAD_R = 8;
const PAD_T = 18;
const WEIGHT_H = 116;
const GAP = 22;
const CAL_H = 104;
const AXIS_H = 20;
const HEIGHT = TREND_CHART_HEIGHT;

const LINE = "#9A3412";
const BAR_UNDER = "#F4A259";
const BAR_OVER = "#C4622D";
const GOAL = "#E2B48C";
const GOAL_TEXT = "#C48A62";
const AXIS = "#8A7360";
const PLOT = "#FBF6EE";

function yFor(value: number, min: number, max: number, top: number, height: number) {
  const span = max - min || 1;
  const clamped = Math.min(max, Math.max(min, value));
  return top + (1 - (clamped - min) / span) * height;
}

function averageKg(value: number | null) {
  return value == null ? "—" : `${value.toFixed(1)}kg`;
}

function pointReadout(point: TrendPoint, span: TrendSpanModel["span"]) {
  const title = point.partial ? `${point.detailTitle}(途中)` : point.detailTitle;
  const kcal = point.kcal == null ? "—" : formatKcal(point.kcal);
  const weight = averageKg(point.weightKg);
  const days = `記録 ${point.recordedDays}日`;
  if (span === "week") {
    return `${title}　合計 ${kcal}(${days})　平均体重 ${weight}`;
  }
  return `${title}　1日平均 ${kcal}(${days})　平均体重 ${weight}`;
}

export function PeriodTrendChart({
  model,
  controls,
  onPage,
}: {
  model: TrendSpanModel;
  controls?: ReactNode;
  onPage: (page: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const olderLabel = model.span === "week" ? "前の28週" : "前の12か月";
  const newerLabel = model.span === "week" ? "次の28週" : "次の12か月";
  const hint =
    model.span === "week"
      ? "週を押すと、その週の体重とカロリーを表示します"
      : "月を押すと、その月の体重とカロリーを表示します";

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
    const count = model.points.length;
    setSelected((current) => {
      const base = current ?? count - 1;
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

  const selectedPoint = selected == null ? null : (model.points[selected] ?? null);
  const plotW = width == null ? 0 : Math.max(width - PAD_L - PAD_R, 1);
  const slot = model.points.length > 0 ? plotW / model.points.length : plotW;
  const weightTop = PAD_T;
  const calTop = PAD_T + WEIGHT_H + GAP;
  const calBottom = calTop + CAL_H;
  const clipId = `period-cal-${model.span}-${model.page}`;

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
      : model.points.flatMap((point, index) =>
          point.weightKg == null
            ? []
            : [
                {
                  index,
                  x: xAt(index),
                  y: yFor(point.weightKg, model.weight!.min, model.weight!.max, weightTop, WEIGHT_H),
                },
              ],
        );

  return (
    <section
      className="w-full rounded-3xl bg-[#F3EBDD] p-3 shadow-sm select-none sm:p-6"
      aria-label={model.span === "week" ? "週間の体重とカロリー" : "月間の体重とカロリー"}
      data-trend-chart="ready"
      data-trend-span={model.span}
      data-trend-page={model.page}
      data-trend-max-page={model.maxPage}
      data-trend-earliest={model.earliest ?? ""}
    >
      <h2 className="text-sm font-medium text-[#F5821F]">体重とカロリー</h2>
      <p className="mt-1 text-[11px] leading-4 text-[#8A7360]">上段 体重（kg） / 下段 摂取カロリー</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-[#F5821F] disabled:opacity-30"
          aria-label={olderLabel}
          disabled={model.page >= model.maxPage}
          onClick={() => onPage(model.page + 1)}
        >
          ‹
        </button>
        <p className="min-w-0 text-center text-sm text-zinc-800" data-trend-range="">
          {model.rangeLabel}
        </p>
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-[#F5821F] disabled:opacity-30"
          aria-label={newerLabel}
          disabled={model.page <= 0}
          onClick={() => onPage(model.page - 1)}
        >
          ›
        </button>
      </div>
      <div
        ref={frame}
        tabIndex={0}
        role="group"
        aria-label={hint}
        onKeyDown={onKeyDown}
        className="mt-1 w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F]/40"
        style={{ touchAction: "manipulation" }}
      >
        {width == null ? (
          <div style={{ height: HEIGHT }} />
        ) : (
          <svg
            role="img"
            aria-label={model.span === "week" ? "週間の体重とカロリー" : "月間の体重とカロリー"}
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
            {model.weight ? (
              model.weight.ticks.map((tick) => {
                const y = yFor(tick, model.weight!.min, model.weight!.max, weightTop, WEIGHT_H);
                return (
                  <g key={`w-${tick}`}>
                    <line x1={PAD_L} x2={PAD_L + plotW} y1={y} y2={y} stroke="#E7DCC8" strokeWidth={1} />
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
            ) : (
              <text
                x={PAD_L + plotW / 2}
                y={weightTop + WEIGHT_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={AXIS}
                fontSize={12}
              >
                この期間の体重記録はありません
              </text>
            )}
            {weightPoints.length > 1 ? (
              <polyline
                points={weightPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke={LINE}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {weightPoints.map((point) => (
              <circle
                key={`p-${point.index}`}
                cx={point.x}
                cy={point.y}
                r={3.5}
                fill={LINE}
                stroke={PLOT}
                strokeWidth={1.5}
              />
            ))}
            {model.calories ? (
              <g>
                {model.calories.ticks.map((tick) => {
                  const y = yFor(tick, model.calories!.min, model.calories!.max, calTop, CAL_H);
                  return (
                    <g key={`c-${tick}`}>
                      <line x1={PAD_L} x2={PAD_L + plotW} y1={y} y2={y} stroke="#E7DCC8" strokeWidth={1} />
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
                  {model.points.map((point, index) => {
                    if (point.kcal == null || !model.calories) {
                      return null;
                    }
                    const yValue = yFor(point.kcal, model.calories.min, model.calories.max, calTop, CAL_H);
                    const barH = Math.max(calBottom - yValue, 2);
                    const barW = Math.max(1.5, Math.min(10, slot * 0.46));
                    const over = model.calories.goal != null && point.kcal > model.calories.goal;
                    return (
                      <rect
                        key={point.key}
                        data-partial={point.partial ? "true" : "false"}
                        x={xAt(index) - barW / 2}
                        y={calBottom - barH}
                        width={barW}
                        height={barH}
                        fill={over ? BAR_OVER : BAR_UNDER}
                        opacity={point.partial ? 0.5 : 1}
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
                この期間のカロリー記録はありません
              </text>
            )}
            {model.calories?.goal != null && model.limitLabel ? (
              <g>
                <line
                  x1={PAD_L}
                  x2={PAD_L + plotW}
                  y1={yFor(model.calories.goal, model.calories.min, model.calories.max, calTop, CAL_H)}
                  y2={yFor(model.calories.goal, model.calories.min, model.calories.max, calTop, CAL_H)}
                  stroke={GOAL}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <text
                  x={PAD_L + plotW - 4}
                  y={yFor(model.calories.goal, model.calories.min, model.calories.max, calTop, CAL_H) - 6}
                  textAnchor="end"
                  fill={GOAL_TEXT}
                  fontSize={10}
                >
                  {`${model.limitLabel} ${formatKcal(model.calories.goal)}`}
                </text>
              </g>
            ) : null}
            {model.points.map((point, index) =>
              point.axisLabel ? (
                <g key={`label-${point.key}`}>
                  {point.yearLabel ? (
                    <text
                      x={xAt(index)}
                      y={calBottom + 8}
                      textAnchor="middle"
                      fill={selected === index ? "#F5821F" : AXIS}
                      fontSize={8}
                    >
                      {point.yearLabel}
                    </text>
                  ) : null}
                  <text
                    x={xAt(index)}
                    y={point.yearLabel ? calBottom + 18 : calBottom + 14}
                    textAnchor="middle"
                    fill={selected === index ? "#F5821F" : AXIS}
                    fontSize={model.span === "month" ? 9 : 10}
                    fontWeight={selected === index ? 600 : 400}
                  >
                    {point.axisLabel}
                  </text>
                </g>
              ) : null,
            )}
            {model.points.map((point, index) => (
              <rect
                key={`hit-${point.key}`}
                x={PAD_L + index * slot}
                y={weightTop}
                width={slot}
                height={calBottom - weightTop + AXIS_H}
                fill="transparent"
                onPointerEnter={(event) => selectFromPointer(event, index)}
                onClick={() => setSelected(index)}
              >
                <title>{pointReadout(point, model.span)}</title>
              </rect>
            ))}
          </svg>
        )}
      </div>
      {controls}
      <p aria-live="polite" data-trend-readout="" className="mt-2 min-h-6 text-center text-sm leading-6 text-zinc-800">
        {selectedPoint ? (
          pointReadout(selectedPoint, model.span)
        ) : (
          <span className="text-[11px] text-zinc-500">{hint}</span>
        )}
      </p>
      <p className="mt-1 text-center text-[11px] leading-5 text-zinc-500" data-trend-summary="">
        {model.summary}
      </p>
    </section>
  );
}
