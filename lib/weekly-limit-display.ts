const SCALE = 1.2;

export type WeeklyLimitDisplay = {
  percent: number;
  over: boolean;
  near: boolean;
  remaining: number;
  excess: number;
  markerPercent: number;
  orangePercent: number;
  redPercent: number;
};

/** 週の合計と上限は、渡された数値のまま使う。バーは上限の120%を幅いっぱいにする。 */
export function weeklyLimitDisplay(weekTotal: number, limit: number): WeeklyLimitDisplay {
  const safeLimit = limit > 0 ? limit : 0;
  const ratio = safeLimit > 0 ? weekTotal / safeLimit : 0;
  const percent = safeLimit > 0 ? Math.round(ratio * 100) : 0;
  const capped = Math.min(Math.max(ratio, 0), SCALE);
  return {
    percent,
    over: safeLimit > 0 && weekTotal > safeLimit,
    near: safeLimit > 0 && weekTotal <= safeLimit && ratio >= 0.8,
    remaining: Math.max(safeLimit - weekTotal, 0),
    excess: Math.max(weekTotal - safeLimit, 0),
    markerPercent: (1 / SCALE) * 100,
    orangePercent: (Math.min(capped, 1) / SCALE) * 100,
    redPercent: (Math.max(capped - 1, 0) / SCALE) * 100,
  };
}
