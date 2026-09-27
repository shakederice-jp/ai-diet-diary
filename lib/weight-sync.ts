import {
  fetchWeightMeasurements,
  isHealthPlanetAuthError,
  refreshAccessToken,
  type HealthPlanetWeight,
} from "@/lib/healthplanet";
import {
  INITIAL_WEIGHT_LOOKBACK_MS,
  MAX_HEALTHPLANET_RANGE_MS,
  buildSyncWindows,
} from "@/lib/healthplanet-time";
import {
  getHealthPlanetToken,
  updateWeightSyncedAt,
  upsertHealthPlanetTokens,
  upsertWeightRecords,
} from "@/lib/supabase/admin";

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export type WeightSyncResult =
  | { status: "not_connected" }
  | { status: "synced"; saved: number };

function tokenExpiresSoon(expiresAt: string, now: number) {
  const time = new Date(expiresAt).getTime();
  return !Number.isFinite(time) || time <= now + REFRESH_BUFFER_MS;
}

async function refreshStoredToken(
  userId: string,
  origin: string,
  refreshToken: string,
  scope: string,
) {
  const tokens = await refreshAccessToken(origin, refreshToken);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await upsertHealthPlanetTokens({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    scope,
  });
  return tokens.access_token;
}

async function fetchWindows(
  accessToken: string,
  windows: Array<{ from: Date; to: Date }>,
) {
  const measurements: HealthPlanetWeight[] = [];
  for (const window of windows) {
    measurements.push(
      ...(await fetchWeightMeasurements({
        accessToken,
        from: window.from,
        to: window.to,
      })),
    );
  }
  return measurements;
}

export async function syncHealthPlanetWeights(
  userId: string,
  origin: string,
): Promise<WeightSyncResult> {
  const stored = await getHealthPlanetToken(userId);
  if (!stored) {
    return { status: "not_connected" };
  }

  const now = new Date();
  let accessToken = stored.access_token;
  let refreshed = false;
  if (tokenExpiresSoon(stored.expires_at, now.getTime())) {
    accessToken = await refreshStoredToken(
      userId,
      origin,
      stored.refresh_token,
      stored.scope,
    );
    refreshed = true;
  }

  const syncedAt = stored.weight_synced_at
    ? new Date(stored.weight_synced_at)
    : null;
  const from =
    syncedAt && Number.isFinite(syncedAt.getTime())
      ? syncedAt
      : new Date(now.getTime() - INITIAL_WEIGHT_LOOKBACK_MS);
  const windows = buildSyncWindows(from, now, MAX_HEALTHPLANET_RANGE_MS);

  let measurements: HealthPlanetWeight[];
  try {
    measurements = await fetchWindows(accessToken, windows);
  } catch (error) {
    if (refreshed || !isHealthPlanetAuthError(error)) {
      throw error;
    }
    accessToken = await refreshStoredToken(
      userId,
      origin,
      stored.refresh_token,
      stored.scope,
    );
    measurements = await fetchWindows(accessToken, windows);
  }

  const byMeasuredAt = new Map<string, HealthPlanetWeight>();
  for (const measurement of measurements) {
    byMeasuredAt.set(measurement.measuredAt.toISOString(), measurement);
  }

  await upsertWeightRecords(
    [...byMeasuredAt.values()].map((measurement) => ({
      user_id: userId,
      measured_at: measurement.measuredAt.toISOString(),
      weight_kg: measurement.weightKg,
      model: measurement.model,
    })),
  );

  if (windows.length > 0) {
    await updateWeightSyncedAt(userId, now.toISOString());
  }

  return { status: "synced", saved: byMeasuredAt.size };
}
