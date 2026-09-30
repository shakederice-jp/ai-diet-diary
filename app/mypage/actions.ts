"use server";

import { revalidatePath } from "next/cache";
import { isAdvisorId } from "@/lib/advisors";
import { upsertAdvisorPreference } from "@/lib/advisor-store";
import { ensureUserIdFromCookies } from "@/lib/session";
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
    const userId = await ensureUserIdFromCookies();
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
