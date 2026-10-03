"use server";

import { revalidatePath } from "next/cache";
import { parseIsoDate } from "@/lib/calendar";
import { declineFreezeForDate, useFreezeForDate } from "@/lib/engagement";
import { getAuthUserId } from "@/lib/supabase/server";
import { storageErrorMessage } from "@/lib/user-settings";

export type FreezeFormState = {
  error: string | null;
};

function refreshEngagement() {
  revalidatePath("/");
  revalidatePath("/mypage");
}

async function chooseFreeze(
  formData: FormData,
  choose: (userId: string, missedOn: string) => Promise<void>,
): Promise<FreezeFormState> {
  const missedOn = String(formData.get("missedOn") ?? "");
  if (!parseIsoDate(missedOn)) {
    return { error: "日付が不正です。" };
  }

  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { error: "ログインしてください。" };
    }
    await choose(userId, missedOn);
    refreshEngagement();
    return { error: null };
  } catch (error) {
    return { error: storageErrorMessage(error, "フリーズの保存に失敗しました。") };
  }
}

export async function useStreakFreeze(
  _previous: FreezeFormState,
  formData: FormData,
): Promise<FreezeFormState> {
  return chooseFreeze(formData, useFreezeForDate);
}

export async function declineStreakFreeze(
  _previous: FreezeFormState,
  formData: FormData,
): Promise<FreezeFormState> {
  return chooseFreeze(formData, declineFreezeForDate);
}
