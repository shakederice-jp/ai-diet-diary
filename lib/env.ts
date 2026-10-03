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

export function getHealthPlanetRedirectUri(origin: string) {
  return (
    process.env.HEALTHPLANET_REDIRECT_URI ??
    `${origin}/api/auth/callback/healthplanet`
  );
}
