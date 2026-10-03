import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode, HEALTHPLANET_SCOPE } from "@/lib/healthplanet";
import {
  clearOAuthStateCookie,
  readStateFromRequest,
} from "@/lib/session";
import { upsertHealthPlanetTokens } from "@/lib/supabase/admin";
import { getAuthUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

function redirectHome(
  origin: string,
  status: "connected" | "error",
  reason?: string,
) {
  const destination = new URL("/", origin);
  destination.searchParams.set("healthplanet", status);
  if (reason) {
    destination.searchParams.set("reason", reason);
  }
  const response = NextResponse.redirect(destination);
  clearOAuthStateCookie(response);
  return response;
}

function statesMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return redirectHome(origin, "error", oauthError);
  }

  try {
    const expectedState = readStateFromRequest(request);
    if (!code || !expectedState) {
      return redirectHome(origin, "error", "invalid_oauth_state");
    }

    // Health Planet often redirects with only `code` and drops `state`.
    // When the parameter comes back, it still has to match the cookie.
    if (state && !statesMatch(expectedState, state)) {
      return redirectHome(origin, "error", "invalid_oauth_state");
    }

    const tokens = await exchangeAuthorizationCode(origin, code);
    const userId = await getAuthUserId();
    if (!userId) {
      return redirectHome(origin, "error", "login_required");
    }
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await upsertHealthPlanetTokens({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: HEALTHPLANET_SCOPE,
    });

    return redirectHome(origin, "connected");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Health Planet callback failed";
    return redirectHome(origin, "error", message);
  }
}
