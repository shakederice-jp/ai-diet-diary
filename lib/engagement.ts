import { getAdvisor, type AdvisorId } from "@/lib/advisors";
import { getAdvisorPreference } from "@/lib/advisor-store";
import { tokyoToday } from "@/lib/calendar";
import { listMeals } from "@/lib/meals";
import { createDataClient } from "@/lib/supabase/server";
import { tokyoDateFromInstant } from "@/lib/weight-format";
import { listWeightsOnDate } from "@/lib/weights";

export const FREEZES_PER_MONTH = 2;
export const AFFECTION_FAMILIAR_AT = 3;
export const AFFECTION_LASTING_AT = 7;

export type AffectionStage = "initial" | "familiar" | "lasting";

export type EngagementSnapshot = {
  today: string;
  streakDays: number;
  atRisk: boolean;
  freezeRemaining: number;
  offerDate: string | null;
  advisorId: AdvisorId | null;
  advisorName: string | null;
  affectionPoints: number;
  affectionStage: AffectionStage;
  compareEnabled: boolean;
  rankingText: string | null;
};

export function affectionStage(points: number): AffectionStage {
  if (points >= AFFECTION_LASTING_AT) {
    return "lasting";
  }
  if (points >= AFFECTION_FAMILIAR_AT) {
    return "familiar";
  }
  return "initial";
}

export function affectionStageLabel(stage: AffectionStage) {
  if (stage === "lasting") {
    return "長続き";
  }
  if (stage === "familiar") {
    return "慣れてきた";
  }
  return "初期";
}

export function shiftIsoDate(date: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`Invalid date: ${date}`);
  }
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return utc.toISOString().slice(0, 10);
}

export function formatMonthDay(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return date;
  }
  return `${Number(match[2])}月${Number(match[3])}日`;
}

function usedInMonth(dates: Set<string>, month: string) {
  let used = 0;
  for (const date of dates) {
    if (date.startsWith(month)) {
      used += 1;
    }
  }
  return used;
}

export function evaluateStreak(input: {
  today: string;
  recordDates: Iterable<string>;
  freezeDates: Iterable<string>;
  declineDates: Iterable<string>;
}) {
  const records = new Set(input.recordDates);
  const freezes = new Set(input.freezeDates);
  const declines = new Set(input.declineDates);
  const yesterday = shiftIsoDate(input.today, -1);
  const dayBefore = shiftIsoDate(input.today, -2);
  const covered = (date: string) => records.has(date) || freezes.has(date);

  let anchor: string | null = null;
  let atRisk = false;
  let offerDate: string | null = null;

  if (records.has(input.today)) {
    anchor = input.today;
  } else if (covered(yesterday)) {
    anchor = yesterday;
    atRisk = true;
  } else if (covered(dayBefore) && !declines.has(yesterday) && !records.has(yesterday)) {
    const remainingForMiss = FREEZES_PER_MONTH - usedInMonth(freezes, yesterday.slice(0, 7));
    if (remainingForMiss > 0) {
      offerDate = yesterday;
      anchor = dayBefore;
    }
  }

  const streakDays = anchor ? countRecordedStreak(anchor, records, freezes) : 0;
  if (streakDays === 0) {
    atRisk = false;
    offerDate = null;
  }

  return {
    streakDays,
    atRisk,
    offerDate,
    freezeRemaining: Math.max(0, FREEZES_PER_MONTH - usedInMonth(freezes, input.today.slice(0, 7))),
  };
}

function countRecordedStreak(endDate: string, records: Set<string>, freezes: Set<string>) {
  let days = 0;
  let cursor = endDate;
  for (let index = 0; index < 400; index += 1) {
    if (records.has(cursor)) {
      days += 1;
    } else if (!freezes.has(cursor)) {
      break;
    }
    cursor = shiftIsoDate(cursor, -1);
  }
  return days;
}

async function listMealDates(userId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("meal_records")
    .select("recorded_on")
    .eq("user_id", userId)
    .order("recorded_on", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Failed to load meal dates: ${error.message}`);
  }

  return ((data ?? []) as Array<{ recorded_on: string }>).map((row) => row.recorded_on);
}

async function listWeightDates(userId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .select("measured_at")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Failed to load weight dates: ${error.message}`);
  }

  return ((data ?? []) as Array<{ measured_at: string }>)
    .map((row) => tokyoDateFromInstant(row.measured_at))
    .filter((date): date is string => Boolean(date));
}

async function listFreezeDates(userId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("streak_freezes")
    .select("frozen_on")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to load streak freezes: ${error.message}`);
  }

  return ((data ?? []) as Array<{ frozen_on: string }>).map((row) => row.frozen_on);
}

async function listDeclineDates(userId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("streak_freeze_declines")
    .select("missed_on")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to load streak freeze declines: ${error.message}`);
  }

  return ((data ?? []) as Array<{ missed_on: string }>).map((row) => row.missed_on);
}

async function listAffectionDates(userId: string, advisorId: AdvisorId) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("advisor_affection_days")
    .select("recorded_on")
    .eq("user_id", userId)
    .eq("advisor_id", advisorId);

  if (error) {
    throw new Error(`Failed to load affection: ${error.message}`);
  }

  return ((data ?? []) as Array<{ recorded_on: string }>).map((row) => row.recorded_on);
}

export async function countAffection(userId: string, advisorId: AdvisorId) {
  const dates = await listAffectionDates(userId, advisorId);
  return dates.length;
}

export async function loadStreakDays(userId: string, now = new Date()) {
  const today = tokyoToday(now).date;
  const [mealDates, weightDates, freezeDates, declineDates] = await Promise.all([
    listMealDates(userId),
    listWeightDates(userId),
    listFreezeDates(userId),
    listDeclineDates(userId),
  ]);
  return evaluateStreak({
    today,
    recordDates: [...mealDates, ...weightDates],
    freezeDates,
    declineDates,
  }).streakDays;
}

export async function loadEngagement(userId: string, now = new Date()): Promise<EngagementSnapshot> {
  const today = tokyoToday(now).date;
  const [mealDates, weightDates, freezeDates, declineDates, advisorId] = await Promise.all([
    listMealDates(userId),
    listWeightDates(userId),
    listFreezeDates(userId),
    listDeclineDates(userId),
    getAdvisorPreference(userId),
  ]);
  const streak = evaluateStreak({
    today,
    recordDates: [...mealDates, ...weightDates],
    freezeDates,
    declineDates,
  });
  const [affectionPoints, compareEnabled] = await Promise.all([
    advisorId ? countAffection(userId, advisorId) : Promise.resolve(0),
    getCompareEnabled(userId),
  ]);
  const stage = affectionStage(affectionPoints);
  await saveStreakSnapshot(userId, streak.streakDays);
  const rankingText = compareEnabled ? await rankingTextFor(streak.streakDays) : null;

  return {
    today,
    ...streak,
    advisorId,
    advisorName: advisorId ? getAdvisor(advisorId).name : null,
    affectionPoints,
    affectionStage: stage,
    compareEnabled,
    rankingText,
  };
}

async function dayHasRecord(userId: string, date: string) {
  const [meals, weights] = await Promise.all([
    listMeals(userId, date),
    listWeightsOnDate(userId, date),
  ]);
  return meals.length > 0 || weights.length > 0;
}

export async function syncDayEngagement(userId: string, date: string) {
  const recorded = await dayHasRecord(userId, date);
  const supabase = await createDataClient();
  if (!recorded) {
    const { error } = await supabase
      .from("advisor_affection_days")
      .delete()
      .eq("user_id", userId)
      .eq("recorded_on", date);
    if (error) {
      throw new Error(`Failed to clear affection: ${error.message}`);
    }
    return;
  }

  const advisorId = await getAdvisorPreference(userId);
  if (!advisorId) {
    return;
  }

  const { error } = await supabase.from("advisor_affection_days").upsert(
    {
      user_id: userId,
      advisor_id: advisorId,
      recorded_on: date,
    },
    { onConflict: "user_id,advisor_id,recorded_on", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`Failed to save affection: ${error.message}`);
  }
}

export async function useFreezeForDate(userId: string, missedOn: string) {
  const snapshot = await loadEngagement(userId);
  if (snapshot.offerDate !== missedOn) {
    throw new Error("この日にはフリーズを使えません。");
  }

  const supabase = await createDataClient();
  const { error } = await supabase.from("streak_freezes").upsert(
    {
      user_id: userId,
      frozen_on: missedOn,
    },
    { onConflict: "user_id,frozen_on", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`Failed to save streak freeze: ${error.message}`);
  }
}

export async function declineFreezeForDate(userId: string, missedOn: string) {
  const snapshot = await loadEngagement(userId);
  if (snapshot.offerDate !== missedOn) {
    throw new Error("この日のフリーズは、もう選べません。");
  }

  const supabase = await createDataClient();
  const { error } = await supabase.from("streak_freeze_declines").upsert(
    {
      user_id: userId,
      missed_on: missedOn,
    },
    { onConflict: "user_id,missed_on", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`Failed to save streak freeze choice: ${error.message}`);
  }
}

export function rankingBucket(higher: number, total: number) {
  if (total <= 0) {
    return null;
  }
  const raw = Math.ceil((higher / total) * 100);
  return Math.min(100, Math.max(10, Math.ceil(raw / 10) * 10));
}

async function saveStreakSnapshot(userId: string, streakDays: number) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("user_streaks").upsert(
    {
      user_id: userId,
      streak_days: streakDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    throw new Error(`Failed to save streak snapshot: ${error.message}`);
  }
}

export async function getCompareEnabled(userId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("ranking_preferences")
    .select("compare_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load ranking preference: ${error.message}`);
  }
  return data?.compare_enabled === true;
}

export async function saveCompareEnabled(userId: string, enabled: boolean) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("ranking_preferences").upsert(
    {
      user_id: userId,
      compare_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    throw new Error(`Failed to save ranking preference: ${error.message}`);
  }
}

async function rankingTextFor(streakDays: number) {
  const supabase = await createDataClient();
  const { data, error } = await supabase.rpc("streak_rank", { my_streak: streakDays });
  if (error) {
    throw new Error(`Failed to rank streaks: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  const higher = Number(row?.higher_count ?? 0);
  const total = Number(row?.total_count ?? 0);
  const bucket = rankingBucket(higher, total);
  return bucket === null ? null : `上位${bucket}%`;
}
