import { createAdminClient } from "@/lib/supabase/admin";
import {
  tokyoDayRange,
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
  const supabase = createAdminClient();
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

export async function insertManualWeight(input: {
  userId: string;
  measuredAt: string;
  weightKg: number;
}) {
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
