"use server";

import { revalidatePath } from "next/cache";
import { isAdvisorId } from "@/lib/advisors";
import { upsertAdvisorPreference } from "@/lib/advisor-store";
import { saveCompareEnabled } from "@/lib/engagement";
import { getAuthUserId } from "@/lib/supabase/server";
import { storageErrorMessage } from "@/lib/user-settings";

export type AdvisorFormState = {
  error: string | null;
  savedAt: number | null;
};

export async function saveAdvisor(
  _state: AdvisorFormState,
  formData: FormData,
): Promise<AdvisorFormState> {
  const advisorId = formData.get("advisorId");
  if (typeof advisorId !== "string" || !isAdvisorId(advisorId)) {
    return { error: "アドバイザーを選んでください。", savedAt: null };
  }

  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { error: "ログインしてください。", savedAt: null };
    }
    await upsertAdvisorPreference(userId, advisorId);
    revalidatePath("/mypage");
    revalidatePath("/", "layout");
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return {
      error: storageErrorMessage(error, "保存に失敗しました。"),
      savedAt: null,
    };
  }
}

export async function setRankingVisible(enabled: boolean) {
  if (typeof enabled !== "boolean") {
    return { error: "設定を保存できませんでした。" };
  }

  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { error: "ログインしてください。" };
    }
    await saveCompareEnabled(userId, enabled);
    revalidatePath("/mypage");
    revalidatePath("/");
    return { error: null };
  } catch (error) {
    return { error: storageErrorMessage(error, "比較表示の保存に失敗しました。") };
  }
}
