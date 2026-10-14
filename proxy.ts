import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

// ログインが必要なパスだけ。/ /howto /login /signup /welcome は入れない。
const protectedPrefixes = ["/days", "/mypage", "/settings", "/goals", "/recipes", "/api/auth/healthplanet"];
const guestOnlyPaths = new Set(["/login", "/signup", "/forgot-password"]);
const LANDING_PATH = "/welcome";

function sessionCookiePrefix() {
  const { hostname } = new URL(getSupabaseUrl());
  return `sb-${hostname.split(".")[0]}-auth-token`;
}

function hasSessionCookie(request: NextRequest) {
  const prefix = sessionCookiePrefix();
  return request.cookies.getAll().some((cookie) => {
    if (!cookie.value) {
      return false;
    }
    return cookie.name === prefix || cookie.name.startsWith(`${prefix}.`);
  });
}

function isAuthLinkError(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get("login") === "error" ||
    request.nextUrl.searchParams.get("error") === "link"
  );
}

function applyCookies(target: NextResponse, source: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

function redirectTo(request: NextRequest, pathname: string, source?: NextResponse) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  return source ? applyCookies(redirect, source) : redirect;
}

function rewriteLanding(request: NextRequest, source?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = LANDING_PATH;
  const rewrite = NextResponse.rewrite(url);
  return source ? applyCookies(rewrite, source) : rewrite;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // セッションのクッキーが無い公開トップは、ログイン確認を待たずに静的ページを出す。
  if (!hasSessionCookie(request) && (path === "/" || path === LANDING_PATH)) {
    if (path === "/" && isAuthLinkError(request)) {
      return redirectTo(request, "/login?error=link");
    }
    if (path === "/") {
      return rewriteLanding(request);
    }
    const next = NextResponse.next();
    next.headers.set("X-Robots-Tag", "noindex");
    return next;
  }

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
  const loggedIn = Boolean(data.user);
  const needsLogin = protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  if (!loggedIn && path === "/") {
    if (isAuthLinkError(request)) {
      return redirectTo(request, "/login?error=link", response);
    }
    return rewriteLanding(request, response);
  }

  if (!loggedIn && needsLogin) {
    const redirectUrl = new URL("/login", request.url);
    if (isAuthLinkError(request)) {
      redirectUrl.searchParams.set("error", "link");
    }
    return applyCookies(NextResponse.redirect(redirectUrl), response);
  }

  if (loggedIn && (guestOnlyPaths.has(path) || path === LANDING_PATH)) {
    return redirectTo(request, "/", response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
