import { NextRequest, NextResponse } from "next/server";
import { publicOrigin, withBase } from "@/lib/base-path";
import { buildAuthorizationUrl } from "@/lib/healthplanet";
import { attachOAuthStateCookie } from "@/lib/session";
import { getAuthUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = publicOrigin(request.nextUrl.origin);
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.redirect(new URL(withBase("/login"), origin));
    }
    const state = crypto.randomUUID();
    const url = buildAuthorizationUrl(origin, state);

    const response = NextResponse.redirect(url);
    attachOAuthStateCookie(response, state);
    return response;
  } catch {
    const destination = new URL(withBase("/mypage"), origin);
    destination.searchParams.set("healthplanet", "error");
    destination.searchParams.set("reason", "failed");
    return NextResponse.redirect(destination);
  }
}
