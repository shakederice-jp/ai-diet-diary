import { createAdminClient } from "@/lib/supabase/admin";

export type StepDayRecord = {
  id: string;
  recordedOn: string;
  steps: number;
  distanceKm: number | null;
  source: string;
};

type StepRow = {
  id: string;
  recorded_on: string;
  steps: number | string;
  distance_km: number | string | null;
  source: string;
};

function asSteps(value: number | string) {
  const steps = typeof value === "number" ? value : Number(value);
  return Number.isFinite(steps) ? Math.round(steps) : 0;
}

function asDistance(value: number | string | null) {
  if (value == null || value === "") {
    return null;
  }
  const distance = typeof value === "number" ? value : Number(value);
  return Number.isFinite(distance) ? distance : null;
}

function mapStep(row: StepRow): StepDayRecord {
  return {
    id: row.id,
    recordedOn: row.recorded_on,
    steps: asSteps(row.steps),
    distanceKm: asDistance(row.distance_km),
    source: row.source,
  };
}

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

export async function listStepOnDate(userId: string, date: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("step_records")
    .select("id, recorded_on, steps, distance_km, source")
    .eq("user_id", userId)
    .eq("recorded_on", date)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load step record: ${error.message}`);
  }
  return data ? mapStep(data as StepRow) : null;
}

export async function listStepsInMonth(userId: string, year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("step_records")
    .select("recorded_on, steps")
    .eq("user_id", userId)
    .gte("recorded_on", start)
    .lte("recorded_on", end);

  if (error) {
    throw new Error(`Failed to load monthly steps: ${error.message}`);
  }

  return ((data ?? []) as Array<{ recorded_on: string; steps: number | string }>).map((row) => ({
    date: row.recorded_on,
    steps: asSteps(row.steps),
  }));
}

export async function saveManualSteps(input: {
  userId: string;
  date: string;
  steps: number;
  distanceKm: number | null;
}) {
  const existing = await listStepOnDate(input.userId, input.date);
  if (existing && existing.source !== "manual") {
    throw new Error("この日の歩数は、手入力以外の記録があるため上書きできません。");
  }
  if (existing) {
    await updateManualSteps({
      userId: input.userId,
      id: existing.id,
      steps: input.steps,
      distanceKm: input.distanceKm,
    });
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("step_records").insert({
    user_id: input.userId,
    recorded_on: input.date,
    steps: input.steps,
    distance_km: input.distanceKm,
    source: "manual",
  });

  if (error) {
    throw new Error(`Failed to save steps: ${error.message}`);
  }
}

export async function updateManualSteps(input: {
  userId: string;
  id: string;
  steps: number;
  distanceKm: number | null;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("step_records")
    .update({
      steps: input.steps,
      distance_km: input.distanceKm,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId)
    .eq("id", input.id)
    .eq("source", "manual")
    .select("id");

  if (error) {
    throw new Error(`Failed to update steps: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("手入力の歩数だけ編集できます。");
  }
}

export async function deleteManualSteps(userId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("step_records")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .eq("source", "manual")
    .select("id");

  if (error) {
    throw new Error(`Failed to delete steps: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("手入力の歩数だけ削除できます。");
  }
}
