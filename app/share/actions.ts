"use server";

import { revalidatePath } from "next/cache";
import { getAdvisor } from "@/lib/advisors";
import { parseIsoDate } from "@/lib/calendar";
import { getAuthUserId } from "@/lib/supabase/server";
import {
  appOrigin,
  deleteOwnShareCard,
  prepareShareDraft,
  publishShareCard,
  replyForShare,
} from "@/lib/share-store";
import { isShareSituationId } from "@/lib/share-situations";

export type ShareDraftState =
  | { ok: false; error: string }
  | {
      ok: true;
      characterId: string;
      name: string;
      streakDays: number;
      weightLabel: string | null;
      situationId: string;
      showStreak: boolean;
      showWeight: boolean;
      reply: string | null;
      cardId: string | null;
      pageUrl: string | null;
      imageUrl: string | null;
    };

export type ShareReplyState = { ok: false; error: string } | { ok: true; text: string };

export type SharePublishState =
  | { ok: false; error: string }
  | {
      ok: true;
      id: string;
      text: string;
      postText: string;
      name: string;
      pageUrl: string;
      imageUrl: string;
    };

function originUrls(origin: string, id: string) {
  return {
    pageUrl: `${origin}/s/${id}`,
    imageUrl: `${origin}/s/${id}/image`,
  };
}

export async function prepareShare(date: string): Promise<ShareDraftState> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "ログインしてください。" };
  }
  if (!parseIsoDate(date)) {
    return { ok: false, error: "日付を確認できませんでした。" };
  }
  try {
    const prepared = await prepareShareDraft(userId, date);
    if (!prepared.ok) {
      return prepared;
    }
    const origin = await appOrigin();
    const urls = prepared.draft.card ? originUrls(origin, prepared.draft.card.id) : null;
    return {
      ok: true,
      characterId: prepared.draft.characterId,
      name: prepared.draft.name,
      streakDays: prepared.draft.streakDays,
      weightLabel: prepared.draft.weightLabel,
      situationId: prepared.draft.situationId,
      showStreak: prepared.draft.showStreak,
      showWeight: prepared.draft.showWeight,
      reply: prepared.draft.reply,
      cardId: prepared.draft.card?.id ?? null,
      pageUrl: urls?.pageUrl ?? null,
      imageUrl: urls?.imageUrl ?? null,
    };
  } catch {
    return { ok: false, error: "シェアカードを開けませんでした。もう一度お試しください。" };
  }
}

export async function loadShareReply(date: string, situationId: string): Promise<ShareReplyState> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "ログインしてください。" };
  }
  if (!parseIsoDate(date) || !isShareSituationId(situationId)) {
    return { ok: false, error: "状況を選び直してください。" };
  }
  try {
    return await replyForShare(userId, date, situationId);
  } catch {
    return { ok: false, error: "返事を作れませんでした。もう一度お試しください。" };
  }
}

export async function publishShare(
  date: string,
  input: { situationId: string; showStreak: boolean; showWeight: boolean },
): Promise<SharePublishState> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "ログインしてください。" };
  }
  if (!parseIsoDate(date) || !isShareSituationId(input.situationId)) {
    return { ok: false, error: "状況を選び直してください。" };
  }
  try {
    const created = await publishShareCard(userId, date, input);
    if (!created.ok) {
      return created;
    }
    const origin = await appOrigin();
    revalidatePath(`/s/${created.card.id}`);
    return {
      ok: true,
      id: created.card.id,
      text: created.card.text,
      postText: created.postText,
      name: getAdvisor(created.card.characterId).name,
      pageUrl: `${origin}/s/${created.card.id}`,
      imageUrl: `${origin}/s/${created.card.id}/image`,
    };
  } catch {
    return { ok: false, error: "シェアカードを作れませんでした。もう一度お試しください。" };
  }
}

export async function removeShareCard(id: string) {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false as const, error: "ログインしてください。" };
  }
  try {
    const removed = await deleteOwnShareCard(userId, id);
    if (removed.ok) {
      revalidatePath("/mypage");
      revalidatePath(`/s/${id}`);
    }
    return removed;
  } catch {
    return { ok: false as const, error: "カードを削除できませんでした。" };
  }
}
