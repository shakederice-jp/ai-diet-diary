import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/healthplanet";
import { attachOAuthStateCookie } from "@/lib/session";
import { getAuthUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
    }
    const state = crypto.randomUUID();
    const url = buildAuthorizationUrl(request.nextUrl.origin, state);

    const response = NextResponse.redirect(url);
    attachOAuthStateCookie(response, state);
    return response;
  } catch {
    const destination = new URL("/mypage", request.nextUrl.origin);
    destination.searchParams.set("healthplanet", "error");
    destination.searchParams.set("reason", "failed");
    return NextResponse.redirect(destination);
  }
}
