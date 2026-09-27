import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type HealthPlanetTokenRow = {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
};

export async function upsertHealthPlanetTokens(row: HealthPlanetTokenRow) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("healthplanet_tokens").upsert(
    {
      ...row,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to save Health Planet tokens: ${error.message}`);
  }
}

export async function getHealthPlanetConnection(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("healthplanet_tokens")
    .select("expires_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Health Planet connection: ${error.message}`);
  }

  return data;
}

export type StoredHealthPlanetToken = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  weight_synced_at: string | null;
};

export async function getHealthPlanetToken(
  userId: string,
): Promise<StoredHealthPlanetToken | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("healthplanet_tokens")
    .select("access_token, refresh_token, expires_at, scope, weight_synced_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Health Planet tokens: ${error.message}`);
  }

  return data;
}

export async function updateWeightSyncedAt(userId: string, syncedAt: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("healthplanet_tokens")
    .update({
      weight_synced_at: syncedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update Health Planet sync time: ${error.message}`);
  }
}

export type WeightRecordInsert = {
  user_id: string;
  measured_at: string;
  weight_kg: number;
  model: string | null;
};

export async function upsertWeightRecords(rows: WeightRecordInsert[]) {
  if (rows.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("weight_records").upsert(rows, {
    onConflict: "user_id,measured_at",
  });

  if (error) {
    throw new Error(`Failed to save weight records: ${error.message}`);
  }
}

export type WeightRecordSummary = {
  measured_at: string;
  weight_kg: number | string;
};

export async function listRecentWeightRecords(
  userId: string,
  limit = 10,
): Promise<WeightRecordSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("weight_records")
    .select("measured_at, weight_kg")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load weight records: ${error.message}`);
  }

  return data ?? [];
}
