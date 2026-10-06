"use server";

import { revalidatePath } from "next/cache";
import { isAdvisorId } from "@/lib/advisors";
import { upsertAdvisorPreference } from "@/lib/advisor-store";
import { saveCompareEnabled } from "@/lib/engagement";
import { getAuthUserId } from "@/lib/supabase/server";
import { saveWeightAxis, storageErrorMessage } from "@/lib/user-settings";
import { formatWeightAxisKg, parseWeightAxisFields } from "@/lib/weight-axis";

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

export type WeightAxisFormState = {
  error: string | null;
  notice: string | null;
  savedAt: number | null;
  minKg: string;
  maxKg: string;
};

function weightAxisErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/schema cache|does not exist|Could not find the table|Could not find the '.+' column/i.test(message)) {
    return "この設定は、まだ保存できない状態です。グラフは自動の範囲のままです。";
  }
  if (/check constraint|weight_axis_preferences_range_check/i.test(message)) {
    return "上限と下限の組み合わせを、もう一度確認してください。";
  }
  if (/ログインしてください/.test(message)) {
    return "ログインしてください。";
  }
  return "保存できませんでした。しばらくしてから、もう一度試してください。";
}

export async function saveWeightAxisForm(
  _state: WeightAxisFormState,
  formData: FormData,
): Promise<WeightAxisFormState> {
  const minKg = String(formData.get("minKg") ?? "");
  const maxKg = String(formData.get("maxKg") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  const keep = { minKg, maxKg, savedAt: null };

  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { ...keep, error: "ログインしてください。", notice: null };
    }

    const parsed =
      intent === "auto" ? ({ ok: true, range: null } as const) : parseWeightAxisFields(minKg, maxKg);
    if (!parsed.ok) {
      return { ...keep, error: parsed.message, notice: null };
    }

    await saveWeightAxis(userId, parsed.range);
    revalidatePath("/mypage");
    revalidatePath("/");
    return {
      error: null,
      notice: parsed.range ? "保存しました。カレンダーの体重グラフに反映されます。" : "自動の範囲に戻しました。",
      savedAt: Date.now(),
      minKg: parsed.range ? formatWeightAxisKg(parsed.range.minKg) : "",
      maxKg: parsed.range ? formatWeightAxisKg(parsed.range.maxKg) : "",
    };
  } catch (error) {
    return { ...keep, error: weightAxisErrorMessage(error), notice: null };
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
