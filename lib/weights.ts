import { createDataClient } from "@/lib/supabase/server";
import {
  latestDailyWeights,
  tokyoDateFromInstant,
  tokyoDayRange,
  tokyoMonthRange,
  type WeightDayRecord,
} from "@/lib/weight-format";

type WeightRow = {
  id: string;
  measured_at: string;
  weight_kg: number | string;
  source: string;
};

function asWeight(value: number | string) {
  const weight = typeof value === "number" ? value : Number(value);
  return Number.isFinite(weight) ? weight : 0;
}

function mapWeight(row: WeightRow): WeightDayRecord {
  return {
    id: row.id,
    measuredAt: row.measured_at,
    weightKg: asWeight(row.weight_kg),
    source: row.source,
  };
}

function isUniqueViolation(error: { code?: string; message?: string }) {
  return error.code === "23505" || /duplicate key/i.test(error.message ?? "");
}

export async function listWeightsOnDate(userId: string, date: string) {
  const range = tokyoDayRange(date);
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .select("id, measured_at, weight_kg, source")
    .eq("user_id", userId)
    .gte("measured_at", range.start)
    .lt("measured_at", range.end)
    .order("measured_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load weight records: ${error.message}`);
  }

  return ((data ?? []) as WeightRow[]).map(mapWeight);
}

export async function listWeightsInMonth(userId: string, year: number, month: number) {
  const range = tokyoMonthRange(year, month);
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .select("measured_at, weight_kg")
    .eq("user_id", userId)
    .gte("measured_at", range.start)
    .lt("measured_at", range.end)
    .order("measured_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load monthly weights: ${error.message}`);
  }

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return latestDailyWeights(
    ((data ?? []) as Array<{ measured_at: string; weight_kg: number | string }>).map((row) => ({
      measuredAt: row.measured_at,
      weightKg: asWeight(row.weight_kg),
    })),
  ).filter((row) => row.date.startsWith(`${monthKey}-`));
}

export async function listWeightsBetween(userId: string, startDate: string, endDate: string) {
  const start = tokyoDayRange(startDate).start;
  const end = tokyoDayRange(endDate).end;
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .select("measured_at, weight_kg")
    .eq("user_id", userId)
    .gte("measured_at", start)
    .lt("measured_at", end)
    .order("measured_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load weight records: ${error.message}`);
  }

  return latestDailyWeights(
    ((data ?? []) as Array<{ measured_at: string; weight_kg: number | string }>).map((row) => ({
      measuredAt: row.measured_at,
      weightKg: asWeight(row.weight_kg),
    })),
  );
}

export async function weightExtent(userId: string) {
  const supabase = await createDataClient();
  const [low, high] = await Promise.all([
    supabase
      .from("weight_records")
      .select("weight_kg")
      .eq("user_id", userId)
      .order("weight_kg", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("weight_records")
      .select("weight_kg")
      .eq("user_id", userId)
      .order("weight_kg", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (low.error) {
    throw new Error(`Failed to load weight range: ${low.error.message}`);
  }
  if (high.error) {
    throw new Error(`Failed to load weight range: ${high.error.message}`);
  }
  if (!low.data || !high.data) {
    return null;
  }

  const minKg = asWeight(low.data.weight_kg);
  const maxKg = asWeight(high.data.weight_kg);
  if (!(minKg > 0) || !(maxKg > 0) || maxKg < minKg) {
    return null;
  }
  return { minKg, maxKg };
}

export async function earliestWeightDate(userId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .select("measured_at")
    .eq("user_id", userId)
    .order("measured_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load earliest weight date: ${error.message}`);
  }
  if (!data?.measured_at) {
    return null;
  }
  return tokyoDateFromInstant(data.measured_at);
}

export async function insertManualWeight(input: {
  userId: string;
  measuredAt: string;
  weightKg: number;
}) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("weight_records").insert({
    user_id: input.userId,
    measured_at: input.measuredAt,
    weight_kg: input.weightKg,
    model: null,
    source: "manual",
  });

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error("同じ測定日時の体重がすでにあります。");
    }
    throw new Error(`Failed to save weight: ${error.message}`);
  }
}

export async function updateManualWeight(input: {
  userId: string;
  id: string;
  measuredAt: string;
  weightKg: number;
}) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .update({
      measured_at: input.measuredAt,
      weight_kg: input.weightKg,
    })
    .eq("user_id", input.userId)
    .eq("id", input.id)
    .eq("source", "manual")
    .select("id");

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error("同じ測定日時の体重がすでにあります。");
    }
    throw new Error(`Failed to update weight: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("手入力の体重だけ編集できます。");
  }
}

export async function deleteManualWeight(userId: string, id: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .eq("source", "manual")
    .select("id");

  if (error) {
    throw new Error(`Failed to delete weight: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("手入力の体重だけ削除できます。");
  }
}
