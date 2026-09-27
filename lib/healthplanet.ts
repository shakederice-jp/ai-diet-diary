import {
  getHealthPlanetClientId,
  getHealthPlanetClientSecret,
  getHealthPlanetRedirectUri,
} from "@/lib/env";

export const HEALTHPLANET_AUTH_URL = "https://www.healthplanet.jp/oauth/auth";
export const HEALTHPLANET_TOKEN_URL = "https://www.healthplanet.jp/oauth/token";
export const HEALTHPLANET_SCOPE = "innerscan,sphygmomanometer,pedometer";

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
