import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
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
  const origin = request.nextUrl.origin;
  const destination = new URL("/", origin);
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      destination.searchParams.set("login", "error");
      return NextResponse.redirect(destination);
    }
  } else if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      destination.searchParams.set("login", "error");
      return NextResponse.redirect(destination);
    }
  } else {
    destination.searchParams.set("login", "error");
    return NextResponse.redirect(destination);
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
