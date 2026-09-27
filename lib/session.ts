import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getHealthPlanetClientSecret } from "@/lib/env";

export const USER_COOKIE = "hp_uid";
export const STATE_COOKIE = "hp_oauth_state";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function signedValue(value: string, secret: string) {
  return `${value}.${sign(value, secret)}`;
}

export function verifySignedValue(raw: string, secret: string) {
  const separator = raw.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  const value = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);
  const expected = sign(value, secret);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return value;
}

export function userCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function stateCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}

export function attachUserIdCookie(response: NextResponse, userId: string) {
  response.cookies.set(
    USER_COOKIE,
    signedValue(userId, getHealthPlanetClientSecret()),
    userCookieOptions(),
  );
}

export function attachOAuthStateCookie(response: NextResponse, state: string) {
  response.cookies.set(STATE_COOKIE, state, stateCookieOptions());
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, "", { ...stateCookieOptions(), maxAge: 0 });
}

export function readUserIdFromRequest(request: NextRequest) {
  const existing = request.cookies.get(USER_COOKIE)?.value;
  if (!existing) {
    return { userId: null as string | null, needsNew: true };
  }

  const userId = verifySignedValue(existing, getHealthPlanetClientSecret());
  if (!userId) {
    return { userId: null, needsNew: true };
  }
  return { userId, needsNew: false };
}

export function readStateFromRequest(request: NextRequest) {
  return request.cookies.get(STATE_COOKIE)?.value ?? null;
}

export async function readUserIdFromCookies() {
  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  try {
    return verifySignedValue(raw, getHealthPlanetClientSecret());
  } catch {
    return null;
  }
}
