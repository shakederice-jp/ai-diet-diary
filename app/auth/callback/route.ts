import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { withBase, publicOrigin } from "@/lib/base-path";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export const runtime = "nodejs";

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  );
}

export async function GET(request: NextRequest) {
  const origin = publicOrigin(request.nextUrl.origin);
  const destination = new URL(withBase("/"), origin);
  let response = NextResponse.redirect(destination);
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.redirect(destination);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (type === "recovery") {
    destination.pathname = withBase("/reset-password");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(withBase("/login?error=link"), origin));
    }
  } else if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(new URL(withBase("/login?error=link"), origin));
    }
  } else {
    return NextResponse.redirect(new URL(withBase("/login?error=link"), origin));
  }

  const { error: claimError } = await supabase.rpc("claim_legacy_diary");
  if (claimError) {
    destination.searchParams.set("claim", "error");
    const failed = NextResponse.redirect(destination);
    for (const cookie of response.cookies.getAll()) {
      failed.cookies.set(cookie);
    }
    return failed;
  }

  return response;
}
