import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

const protectedPrefixes = ["/days", "/mypage", "/settings", "/goals", "/api/auth/healthplanet"];
const guestOnlyPaths = new Set(["/login", "/signup", "/forgot-password"]);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const loggedIn = Boolean(data.user);
  const needsLogin = protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  if (!loggedIn && (needsLogin || path === "/")) {
    const redirectUrl = new URL("/login", request.url);
    if (request.nextUrl.searchParams.get("login") === "error" || request.nextUrl.searchParams.get("error") === "link") {
      redirectUrl.searchParams.set("error", "link");
    }
    const redirect = NextResponse.redirect(redirectUrl);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  if (loggedIn && guestOnlyPaths.has(path)) {
    const redirect = NextResponse.redirect(new URL("/", request.url));
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
