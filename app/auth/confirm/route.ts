import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function loginError(origin: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", "link");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const cookieJar: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookieJar.splice(0, cookieJar.length, ...cookiesToSet);
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
      },
    },
  });

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return loginError(origin);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return loginError(origin);
    }
  } else {
    return loginError(origin);
  }

  const destination = new URL(type === "recovery" ? "/reset-password" : "/", origin);
  const { error: claimError } = await supabase.rpc("claim_legacy_diary");
  if (claimError) {
    destination.searchParams.set("claim", "error");
  }

  const response = NextResponse.redirect(destination);
  for (const { name, value, options } of cookieJar) {
    response.cookies.set(name, value, options);
  }
  return response;
}
