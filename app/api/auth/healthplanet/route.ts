import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/healthplanet";
import {
  attachOAuthStateCookie,
  attachUserIdCookie,
  readUserIdFromRequest,
} from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { userId, needsNew } = readUserIdFromRequest(request);
    const resolvedUserId = userId ?? crypto.randomUUID();
    const state = crypto.randomUUID();
    const url = buildAuthorizationUrl(request.nextUrl.origin, state);

    const response = NextResponse.redirect(url);
    if (needsNew) {
      attachUserIdCookie(response, resolvedUserId);
    }
    attachOAuthStateCookie(response, state);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Health Planet authorization failed";
    const destination = new URL("/", request.nextUrl.origin);
    destination.searchParams.set("healthplanet", "error");
    destination.searchParams.set("reason", message);
    return NextResponse.redirect(destination);
  }
}
