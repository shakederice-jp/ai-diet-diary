"use server";

import { revalidatePath } from "next/cache";
import { parseProfileInput } from "@/lib/calorie-plan";
import { tokyoToday } from "@/lib/calendar";
import { ensureUserIdFromCookies } from "@/lib/session";
import { storageErrorMessage, upsertProfile } from "@/lib/user-settings";

export type ProfileFormState = {
  error: string | null;
  savedAt: number | null;
};

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  try {
    const userId = await ensureUserIdFromCookies();
    const parsed = parseProfileInput({
      heightCm: readText(formData, "heightCm"),
      birthDate: readText(formData, "birthDate"),
      gender: readText(formData, "gender"),
      activityLevel: readText(formData, "activityLevel"),
      today: tokyoToday(),
    });
    if (!parsed.ok) {
      return { error: parsed.error, savedAt: null };
    }

    await upsertProfile(userId, parsed.value);
    revalidatePath("/settings");
    revalidatePath("/goals");
    return { error: null, savedAt: Date.now() };
  } catch (error) {
    return { error: storageErrorMessage(error, "保存に失敗しました。"), savedAt: null };
  }
}
