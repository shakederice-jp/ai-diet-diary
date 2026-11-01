"use server";

import { revalidatePath } from "next/cache";
import { getAdvisorPreference } from "@/lib/advisor-store";
import { parseIsoDate, tokyoToday } from "@/lib/calendar";
import {
  getDiaryEntry,
  saveDiaryBody,
  saveDiaryReply,
  saveDiaryShareReply,
} from "@/lib/diary";
import { DIARY_BODY_LIMIT, DIARY_REPLY_LIMIT } from "@/lib/diary-shared";
import { generateDiaryReply } from "@/lib/diary-reply";
import { clipText, textLength } from "@/lib/diary-text";
import { getAuthUserId } from "@/lib/supabase/server";

export type DiarySaveState = {
  ok: boolean;
  error?: string;
  message?: string;
  body?: string;
  reply?: string | null;
  sensitive?: boolean;
  shareReply?: boolean;
  replyCount?: number;
  advisorId?: string | null;
  regenerated?: boolean;
};

function refreshDiary(date: string) {
  revalidatePath(`/days/${date}`);
  revalidatePath(`/months/${date.slice(0, 7)}`);
  revalidatePath("/");
}

export async function saveDiary(date: string, body: string): Promise<DiarySaveState> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "ログインしてください。" };
  }
  if (!parseIsoDate(date)) {
    return { ok: false, error: "日付を確認できませんでした。" };
  }
  if (date > tokyoToday().date) {
    return { ok: false, error: "今日までの日付に書けます。" };
  }
  const text = clipText(body, DIARY_BODY_LIMIT);
  if (!text.trim() || textLength(text) > DIARY_BODY_LIMIT) {
    return { ok: false, error: "ひとことを、500文字以内で書いてください。" };
  }

  let existing = null as Awaited<ReturnType<typeof getDiaryEntry>>;
  try {
    existing = await getDiaryEntry(userId, date);
    await saveDiaryBody(userId, date, text);
  } catch {
    return { ok: false, error: "日記を保存できませんでした。" };
  }

  const unchanged = existing?.body === text && Boolean(existing.aiReply);
  if (unchanged) {
    refreshDiary(date);
    return {
      ok: true,
      body: text,
      reply: existing?.aiReply ?? null,
      sensitive: existing?.replySensitive ?? false,
      shareReply: existing?.shareReply ?? true,
      replyCount: existing?.replyCount ?? 0,
      advisorId: existing?.advisorId ?? null,
      regenerated: false,
    };
  }

  if ((existing?.replyCount ?? 0) >= DIARY_REPLY_LIMIT) {
    refreshDiary(date);
    return {
      ok: true,
      body: text,
      reply: existing?.aiReply ?? null,
      sensitive: existing?.replySensitive ?? false,
      shareReply: existing?.shareReply ?? false,
      replyCount: existing?.replyCount ?? DIARY_REPLY_LIMIT,
      advisorId: existing?.advisorId ?? null,
      regenerated: false,
      message: "きょうの返事は、ここまでにします。文章はそのまま残してあります。",
    };
  }

  let advisorId = null as Awaited<ReturnType<typeof getAdvisorPreference>>;
  try {
    advisorId = await getAdvisorPreference(userId);
  } catch {
    refreshDiary(date);
    return {
      ok: true,
      body: text,
      reply: existing?.aiReply ?? null,
      sensitive: existing?.replySensitive ?? false,
      shareReply: existing?.shareReply ?? true,
      replyCount: existing?.replyCount ?? 0,
      advisorId: existing?.advisorId ?? null,
      regenerated: false,
      message: "文章は保存しました。返事は、いま作れませんでした。",
    };
  }
  if (!advisorId) {
    refreshDiary(date);
    return {
      ok: true,
      body: text,
      reply: existing?.aiReply ?? null,
      sensitive: existing?.replySensitive ?? false,
      shareReply: existing?.shareReply ?? true,
      replyCount: existing?.replyCount ?? 0,
      advisorId: existing?.advisorId ?? null,
      regenerated: false,
      message: "文章は保存しました。返事をもらうには、マイページでアドバイザーを選んでください。",
    };
  }

  const generated = await generateDiaryReply(userId, advisorId, text);
  if (!generated) {
    refreshDiary(date);
    return {
      ok: true,
      body: text,
      reply: existing?.aiReply ?? null,
      sensitive: existing?.replySensitive ?? false,
      shareReply: existing?.shareReply ?? true,
      replyCount: existing?.replyCount ?? 0,
      advisorId: existing?.advisorId ?? null,
      regenerated: false,
      message: "文章は保存しました。返事は、いま作れませんでした。",
    };
  }

  const shareReply = generated.sensitive ? false : existing && !existing.replySensitive ? existing.shareReply : true;
  const replyCount = (existing?.replyCount ?? 0) + 1;
  try {
    await saveDiaryReply(userId, date, {
      reply: generated.reply,
      advisorId,
      sensitive: generated.sensitive,
      shareReply,
      replyCount,
    });
  } catch {
    refreshDiary(date);
    return {
      ok: true,
      body: text,
      reply: existing?.aiReply ?? null,
      sensitive: existing?.replySensitive ?? false,
      shareReply: existing?.shareReply ?? true,
      replyCount: existing?.replyCount ?? 0,
      advisorId: existing?.advisorId ?? null,
      regenerated: false,
      message: "文章は保存しました。返事は、いま作れませんでした。",
    };
  }
  refreshDiary(date);
  return {
    ok: true,
    body: text,
    reply: generated.reply,
    sensitive: generated.sensitive,
    shareReply,
    replyCount,
    advisorId,
    regenerated: true,
  };
}

export async function setDiaryShareReply(date: string, shareReply: boolean) {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false as const, error: "ログインしてください。" };
  }
  if (!parseIsoDate(date) || date > tokyoToday().date) {
    return { ok: false as const, error: "日付を確認できませんでした。" };
  }
  try {
    const saved = await saveDiaryShareReply(userId, date, shareReply);
    if (saved.ok) {
      refreshDiary(date);
    }
    return saved;
  } catch {
    return { ok: false as const, error: "シェアの設定を保存できませんでした。" };
  }
}
