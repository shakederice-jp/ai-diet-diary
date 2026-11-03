"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getMealCalorieRecordsBetween } from "@/lib/calories";
import { WEEK_START_COOKIE, parseWeekStart, tokyoToday } from "@/lib/calendar";
import { earliestMealDate } from "@/lib/meals";
import { getAuthUserId } from "@/lib/supabase/server";
import {
  buildMonthSpan,
  buildWeekSpan,
  maxMonthPage,
  maxWeekPage,
  monthWindow,
  weekWindow,
  type TrendSpan,
} from "@/lib/trend-span";
import { sharedWeightScale } from "@/lib/month-trend";
import { getCalorieGoal, getWeightAxis } from "@/lib/user-settings";
import { earliestWeightDate, listWeightsBetween, weightExtent } from "@/lib/weights";

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
  revalidatePath("/");
  revalidatePath("/mypage");
}

function earlierDate(left: string | null, right: string | null) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  return left < right ? left : right;
}

export async function loadTrendSpan(input: { span: TrendSpan; page: number }) {
  if (input.span !== "week" && input.span !== "month") {
    return { ok: false as const, error: "グラフを読み込めませんでした。" };
  }

  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false as const, error: "ログインしてください。" };
  }

  const requested = Number.isFinite(input.page) ? Math.max(0, Math.floor(input.page)) : 0;
  const store = await cookies();
  const weekStartsOn = parseWeekStart(store.get(WEEK_START_COOKIE)?.value);
  const today = tokyoToday().date;

  try {
    const [mealDate, weightDate, goal, axis, extent] = await Promise.all([
      earliestMealDate(userId),
      earliestWeightDate(userId),
      getCalorieGoal(userId).catch(() => null),
      getWeightAxis(userId).catch(() => null),
      weightExtent(userId).catch(() => null),
    ]);
    const earliest = earlierDate(mealDate, weightDate);
    const weeklyKcal = goal && goal.weeklyKcal > 0 ? goal.weeklyKcal : null;
    const page =
      input.span === "week"
        ? Math.min(requested, maxWeekPage(today, earliest, weekStartsOn))
        : Math.min(requested, maxMonthPage(today, earliest));
    const range =
      input.span === "week"
        ? weekWindow(today, page, weekStartsOn)
        : null;
    const months = input.span === "month" ? monthWindow(today, page) : null;
    const start =
      range?.[0]?.start ??
      `${months![0].year}-${String(months![0].month).padStart(2, "0")}-01`;
    const lastMonth = months?.[months.length - 1];
    const end =
      range?.[range.length - 1]?.end ??
      `${lastMonth!.year}-${String(lastMonth!.month).padStart(2, "0")}-${String(new Date(Date.UTC(lastMonth!.year, lastMonth!.month, 0)).getUTCDate()).padStart(2, "0")}`;
    const [calories, weights] = await Promise.all([
      getMealCalorieRecordsBetween(userId, start, end),
      listWeightsBetween(userId, start, end),
    ]);
    const weightScale = sharedWeightScale(extent, axis);
    const shared = {
      today,
      page,
      weekStartsOn,
      earliest,
      weeklyKcal,
      calories,
      weights,
      ...(weightScale ? { weightScale } : {}),
    };
    return {
      ok: true as const,
      model: input.span === "week" ? buildWeekSpan(shared) : buildMonthSpan(shared),
    };
  } catch {
    return { ok: false as const, error: "グラフを読み込めませんでした。" };
  }
}
