import {
  getHealthPlanetClientId,
  getHealthPlanetClientSecret,
  getHealthPlanetRedirectUri,
} from "@/lib/env";
import {
  formatHealthPlanetTimestamp,
  parseHealthPlanetTimestamp,
} from "@/lib/healthplanet-time";

export const HEALTHPLANET_AUTH_URL = "https://www.healthplanet.jp/oauth/auth";
export const HEALTHPLANET_TOKEN_URL = "https://www.healthplanet.jp/oauth/token";
export const HEALTHPLANET_INNERSCAN_URL =
  "https://www.healthplanet.jp/status/innerscan.json";
export const HEALTHPLANET_SCOPE = "innerscan,sphygmomanometer,pedometer";
export const HEALTHPLANET_WEIGHT_TAG = "6021";

export type HealthPlanetTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export function buildAuthorizationUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: getHealthPlanetClientId(),
    redirect_uri: getHealthPlanetRedirectUri(origin),
    scope: HEALTHPLANET_SCOPE,
    response_type: "code",
    state,
  });

  return `${HEALTHPLANET_AUTH_URL}?${params.toString()}`;
}

async function postToken(body: URLSearchParams) {
  const response = await fetch(HEALTHPLANET_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  let payload: Partial<HealthPlanetTokenResponse> & { error?: string } = {};
  try {
    payload = JSON.parse(text) as HealthPlanetTokenResponse;
  } catch {
    throw new Error(
      `Health Planet token endpoint returned a non-JSON response (${response.status})`,
    );
  }

  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(
      payload.error ??
        `Health Planet token exchange failed (${response.status})`,
    );
  }

  const expiresIn = Number(payload.expires_in);

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 2_592_000,
  } satisfies HealthPlanetTokenResponse;
}

export async function exchangeAuthorizationCode(origin: string, code: string) {
  const body = new URLSearchParams({
    client_id: getHealthPlanetClientId(),
    client_secret: getHealthPlanetClientSecret(),
    redirect_uri: getHealthPlanetRedirectUri(origin),
    code,
    grant_type: "authorization_code",
  });

  return postToken(body);
}

export async function refreshAccessToken(
  origin: string,
  refreshToken: string,
) {
  const body = new URLSearchParams({
    client_id: getHealthPlanetClientId(),
    client_secret: getHealthPlanetClientSecret(),
    redirect_uri: getHealthPlanetRedirectUri(origin),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  return postToken(body);
}

export class HealthPlanetRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "HealthPlanetRequestError";
    this.status = status;
    this.code = code;
  }
}

export function isHealthPlanetAuthError(error: unknown) {
  if (!(error instanceof HealthPlanetRequestError)) {
    return false;
  }
  return (
    error.status === 401 ||
    error.code === "invalid_token" ||
    error.code === "expired_token"
  );
}

export type HealthPlanetWeight = {
  measuredAt: Date;
  weightKg: number;
  model: string | null;
};

type InnerScanRow = {
  date?: string;
  keydata?: string;
  model?: string;
  tag?: string;
};

type InnerScanResponse = {
  data?: InnerScanRow[];
  error?: string;
};

export async function fetchWeightMeasurements(input: {
  accessToken: string;
  from: Date;
  to: Date;
}): Promise<HealthPlanetWeight[]> {
  let from = formatHealthPlanetTimestamp(input.from);
  let to = formatHealthPlanetTimestamp(input.to);
  if (from >= to) {
    to = formatHealthPlanetTimestamp(
      new Date(parseHealthPlanetTimestamp(from).getTime() + 1000),
    );
  }

  const body = new URLSearchParams({
    access_token: input.accessToken,
    // Registration date, so a visit loads data registered since the previous visit.
    date: "0",
    tag: HEALTHPLANET_WEIGHT_TAG,
    from,
    to,
  });

  const response = await fetch(HEALTHPLANET_INNERSCAN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const text = await response.text();
  let payload: InnerScanResponse = {};
  try {
    payload = JSON.parse(text) as InnerScanResponse;
  } catch {
    throw new HealthPlanetRequestError(
      `Health Planet weight endpoint returned a non-JSON response (${response.status})`,
      response.status,
      null,
    );
  }

  if (!response.ok || payload.error) {
    throw new HealthPlanetRequestError(
      payload.error ?? `Health Planet weight request failed (${response.status})`,
      response.status,
      payload.error ?? null,
    );
  }

  const rows = Array.isArray(payload.data) ? payload.data : [];
  const weights: HealthPlanetWeight[] = [];
  for (const row of rows) {
    if (row.tag && row.tag !== HEALTHPLANET_WEIGHT_TAG) {
      continue;
    }
    if (!row.date) {
      continue;
    }
    const weightKg = Number(row.keydata);
    if (!Number.isFinite(weightKg)) {
      continue;
    }
    weights.push({
      measuredAt: parseHealthPlanetTimestamp(row.date),
      weightKg,
      model: row.model?.trim() ? row.model : null,
    });
  }

  return weights;
}
