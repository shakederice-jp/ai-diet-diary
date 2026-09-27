"use server";

import { cookies } from "next/headers";
import { WEEK_START_COOKIE, parseWeekStart } from "@/lib/calendar";

export async function setWeekStart(formData: FormData) {
  const weekStart = parseWeekStart(String(formData.get("weekStart") ?? ""));
  const requested = formData.get("weekStart");
  if (requested !== "sunday" && requested !== "monday") {
    return;
  }

  const store = await cookies();
  store.set(WEEK_START_COOKIE, weekStart, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
