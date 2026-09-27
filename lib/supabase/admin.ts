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
