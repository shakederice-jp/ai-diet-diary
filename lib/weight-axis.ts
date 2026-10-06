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
const PRIMARY_STEPS = [0.5, 1, 2, 5, 10, 20, 50, 100];
const EXTRA_STEPS = [2.5];

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

export function chooseWeightAxisTicks(min: number, max: number) {
  return (
    bestTicks(PRIMARY_STEPS, min, max, (count) => count >= 4 && count <= 6) ??
    bestTicks([...PRIMARY_STEPS, ...EXTRA_STEPS], min, max, (count) => count >= 4 && count <= 6) ??
    bestTicks([...PRIMARY_STEPS, ...EXTRA_STEPS], min, max, (count) => count >= 3 && count <= 7) ??
    bestTicks([...PRIMARY_STEPS, ...EXTRA_STEPS], min, max, (count) => count > 0) ??
    [roundTenth(min), roundTenth(max)]
  );
}

function bestTicks(
  steps: number[],
  min: number,
  max: number,
  accept: (count: number) => boolean,
) {
  const options = steps
    .map((step) => ({ step, ticks: ticksAt(min, max, step) }))
    .filter((option) => accept(option.ticks.length));
  options.sort((left, right) => {
    const distance = Math.abs(left.ticks.length - 5) - Math.abs(right.ticks.length - 5);
    if (distance !== 0) {
      return distance;
    }
    return right.step - left.step;
  });
  return options[0]?.ticks ?? null;
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

function roundTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function ticksAt(min: number, max: number, step: number) {
  const ticks: number[] = [];
  const first = Math.ceil(min / step - 1e-8);
  const last = Math.floor(max / step + 1e-8);
  for (let index = first; index <= last && ticks.length < 12; index += 1) {
    const value = roundTenth(index * step);
    if (value < min - 1e-6 || value > max + 1e-6) {
      continue;
    }
    if (ticks[ticks.length - 1] !== value) {
      ticks.push(value);
    }
  }
  return ticks;
}
