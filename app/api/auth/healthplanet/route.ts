import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/healthplanet";
import { attachOAuthStateCookie } from "@/lib/session";
import { getAuthUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.redirect(new URL("/", request.nextUrl.origin));
    }
    const state = crypto.randomUUID();
    const url = buildAuthorizationUrl(request.nextUrl.origin, state);

    const response = NextResponse.redirect(url);
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
