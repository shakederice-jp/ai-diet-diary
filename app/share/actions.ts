"use server";

import { revalidatePath } from "next/cache";
import { parseIsoDate } from "@/lib/calendar";
import { getAdvisor } from "@/lib/advisors";
import { getAuthUserId } from "@/lib/supabase/server";
import { appOrigin, createShareCardForDate, deleteOwnShareCard } from "@/lib/share-store";

export type ShareActionState =
  | { ok: false; error: string }
  | {
      ok: true;
      id: string;
      text: string;
      name: string;
      pageUrl: string;
      imageUrl: string;
    };

export async function createShareCard(date: string): Promise<ShareActionState> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "ログインしてください。" };
  }
  if (!parseIsoDate(date)) {
    return { ok: false, error: "日付を確認できませんでした。" };
  }
  try {
    const created = await createShareCardForDate(userId, date);
    if (!created.ok) {
      return created;
    }
    const origin = await appOrigin();
    return {
      ok: true,
      id: created.card.id,
      text: created.card.text,
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
    }
    return removed;
  } catch {
    return { ok: false as const, error: "カードを削除できませんでした。" };
  }
}
