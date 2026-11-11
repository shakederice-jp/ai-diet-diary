import { BASE_PATH } from "@/lib/base-path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getHealthPlanetClientId() {
  return required("HEALTHPLANET_CLIENT_ID");
}

export function getHealthPlanetClientSecret() {
  return required("HEALTHPLANET_CLIENT_SECRET");
}

export function getSupabaseUrl() {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

export function getAnthropicApiKey() {
  return required("ANTHROPIC_API_KEY");
}

/**
 * Health Planet に登録したリダイレクトURLと完全に同じ値を返す。
 * 本番は固定(古い環境変数 HEALTHPLANET_REDIRECT_URI が残っていても使わない)。
 * origin は publicOrigin() を通したものを渡す。
 */
export function getHealthPlanetRedirectUri(origin: string) {
  if (process.env.NODE_ENV !== "production" && process.env.HEALTHPLANET_REDIRECT_URI) {
    return process.env.HEALTHPLANET_REDIRECT_URI;
  }
  return `${origin}${BASE_PATH}/api/auth/callback/healthplanet`;
}
