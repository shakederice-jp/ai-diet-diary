export type WeightAxisRange = {
  minKg: number;
  maxKg: number;
};

export type WeightAxisParseResult =
  | { ok: true; range: WeightAxisRange | null }
  | { ok: false; message: string };

const MIN_KG = 20;
const MAX_KG = 300;
const MIN_SPAN_KG = 2;
const INTEGER_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500];

export function parseWeightAxisFields(minText: string, maxText: string): WeightAxisParseResult {
  const minRaw = normalizeKgText(minText);
  const maxRaw = normalizeKgText(maxText);
  if (!minRaw && !maxRaw) {
    return { ok: true, range: null };
  }
  if (!minRaw || !maxRaw) {
    return {
      ok: false,
      message: "上限と下限は、両方入れるか、両方空にしてください。片方だけでは、グラフの範囲が決まりません。",
    };
  }

  const minKg = parseAxisKg(minRaw);
  const maxKg = parseAxisKg(maxRaw);
  if (minKg === null || maxKg === null) {
    return {
      ok: false,
      message: "半角の数字で、小数点は1桁までにしてください。たとえば 62.5 です。",
    };
  }
  if (minKg < MIN_KG || minKg > MAX_KG || maxKg < MIN_KG || maxKg > MAX_KG) {
    return { ok: false, message: "20kgから300kgまでの数字にしてください。" };
  }
  if (!(maxKg > minKg)) {
    return { ok: false, message: "上限は、下限より大きい数字にしてください。" };
  }
  if (Math.round((maxKg - minKg) * 10) < MIN_SPAN_KG * 10) {
    return { ok: false, message: "上限と下限は、2kg以上はなしてください。" };
  }
  return { ok: true, range: { minKg, maxKg } };
}

export function formatWeightAxisKg(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function coerceStoredWeightAxis(min: unknown, max: unknown): WeightAxisRange | null {
  if (min == null && max == null) {
    return null;
  }
  const parsed = parseWeightAxisFields(min == null ? "" : String(min), max == null ? "" : String(max));
  return parsed.ok ? parsed.range : null;
}

export function isWeightOutsideRange(value: number, min: number, max: number) {
  return value < min - 1e-6 || value > max + 1e-6;
}

export function hasWeightOutsideRange(values: number[], min: number, max: number) {
  return values.some((value) => Number.isFinite(value) && isWeightOutsideRange(value, min, max));
}

export function weightPlotFraction(value: number, min: number, max: number) {
  const span = max - min;
  if (!(span > 0)) {
    return 0;
  }
  return (value - min) / span;
}

export function integerWeightScale(low: number, high: number) {
  let bottom = low;
  let top = high;
  if (!Number.isFinite(bottom) || !Number.isFinite(top)) {
    bottom = 60;
    top = 70;
  }
  if (top < bottom) {
    const swap = bottom;
    bottom = top;
    top = swap;
  }
  if (top - bottom < 1e-9) {
    bottom -= 1;
    top += 1;
  }

  for (const step of INTEGER_STEPS) {
    if (step * 2 + 1e-9 < top - bottom) {
      continue;
    }
    let start = Math.floor(bottom / step + 1e-9) * step;
    const shifted = start - step;
    if (bottom - start < 1e-6 && shifted + step * 2 >= top - 1e-6) {
      start = shifted;
    }
    const end = start + step * 2;
    if (end + 1e-6 < top || start - 1e-6 > bottom) {
      continue;
    }
    const ticks = [start, start + step, end].map((tick) => Math.round(tick));
    return {
      min: Math.max(0, ticks[0] - 1),
      max: ticks[2] + 1,
      ticks,
    };
  }

  const step = INTEGER_STEPS[INTEGER_STEPS.length - 1];
  const start = Math.floor(bottom / step) * step;
  const ticks = [start, start + step, start + step * 2];
  return { min: Math.max(0, ticks[0] - 1), max: ticks[2] + 1, ticks };
}

export function chooseWeightAxisTicks(min: number, max: number) {
  const mid = Math.round(((min + max) / 2) * 10) / 10;
  return [min, mid, max];
}

export function goalWeightInAxis(goalKg: number | null, min: number, max: number) {
  if (goalKg == null || !Number.isFinite(goalKg)) {
    return null;
  }
  if (isWeightOutsideRange(goalKg, min, max)) {
    return null;
  }
  return goalKg;
}

function normalizeKgText(value: string) {
  return value
    .trim()
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, ".")
    .replace(/[，、,]/g, ".");
}

function parseAxisKg(value: string) {
  if (!/^\d{1,3}(\.\d)?$/.test(value) && !/^\d{1,3}\.\d0+$/.test(value)) {
    return null;
  }
  const rounded = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(rounded)) {
    return null;
  }
  return rounded;
}
