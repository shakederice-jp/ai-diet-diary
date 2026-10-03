export type StepDayRecord = {
  id: string;
  recordedOn: string;
  steps: number;
  distanceKm: number | null;
  source: string;
};

export function stepSourceLabel(source: string) {
  return source === "manual" ? "手入力" : source;
}

export function parseSteps(value: string) {
  const trimmed = value.trim();
  if (!/^\d{1,6}$/.test(trimmed)) {
    return null;
  }
  const steps = Number(trimmed);
  if (steps > 200_000) {
    return null;
  }
  return steps;
}

export function parseDistanceKm(value: string):
  | { ok: true; distanceKm: number | null }
  | { ok: false; error: string } {
  const trimmed = value.trim();
  if (trimmed === "") {
    return { ok: true, distanceKm: null };
  }
  if (!/^\d{1,3}(\.\d)?$/.test(trimmed)) {
    return { ok: false, error: "距離は0〜200kmで、小数第1位まで入力してください。" };
  }
  const distanceKm = Number(trimmed);
  if (distanceKm > 200) {
    return { ok: false, error: "距離は0〜200kmで、小数第1位まで入力してください。" };
  }
  return { ok: true, distanceKm };
}
