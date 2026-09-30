import {
  advisorRecordHash,
  buildAdvisorPrompt,
  getAdvisor,
  type AdvisorId,
} from "@/lib/advisors";
import {
  deleteAdvisorComment,
  getAdvisorComment,
  getAdvisorPreference,
  upsertAdvisorComment,
} from "@/lib/advisor-store";
import { generateAdvisorComment } from "@/lib/claude";
import { affectionStage, countAffection, type AffectionStage } from "@/lib/engagement";
import type { MealEntry } from "@/lib/meals";

export type AdvisorCommentView =
  | { kind: "choose" }
  | { kind: "empty"; advisorId: AdvisorId; text: string }
  | { kind: "comment"; advisorId: AdvisorId; text: string; cached: boolean }
  | { kind: "error"; message: string };

async function loadBond(userId: string, advisorId: AdvisorId): Promise<AffectionStage> {
  try {
    return affectionStage(await countAffection(userId, advisorId));
  } catch {
    return "initial";
  }
}

function failureView(error: unknown): AdvisorCommentView {
  const message = error instanceof Error ? error.message : "";
  if (/schema cache|does not exist|Could not find the table/i.test(message)) {
    return {
      kind: "error",
      message: "アドバイザー用のテーブルがありません。マイグレーションを適用してください。",
    };
  }
  if (/is not set|ANTHROPIC/.test(message)) {
    return { kind: "error", message: "APIキーの環境変数を設定してください。" };
  }
  return {
    kind: "error",
    message: "コメントを作れませんでした。しばらくしてから開き直してください。",
  };
}

export async function loadAdvisorComment(input: {
  userId: string;
  date: string;
  meals: MealEntry[];
  dailyGoal: number;
}): Promise<AdvisorCommentView> {
  let advisorId: AdvisorId | null;
  try {
    advisorId = await getAdvisorPreference(input.userId);
  } catch (error) {
    return failureView(error);
  }

  if (!advisorId) {
    return { kind: "choose" };
  }

  const advisor = getAdvisor(advisorId);
  if (input.meals.length === 0) {
    await deleteAdvisorComment(input.userId, input.date).catch(() => undefined);
    return { kind: "empty", advisorId, text: advisor.emptyLine };
  }

  const bond = await loadBond(input.userId, advisorId);
  const recordHash = advisorRecordHash({
    advisorId,
    dailyGoal: input.dailyGoal,
    bond,
    meals: input.meals,
  });

  try {
    const cached = await getAdvisorComment(input.userId, input.date);
    if (
      cached &&
      cached.advisorId === advisorId &&
      cached.recordHash === recordHash &&
      cached.comment.trim()
    ) {
      return { kind: "comment", advisorId, text: cached.comment, cached: true };
    }

    const text = await generateAdvisorComment(
      buildAdvisorPrompt({
        advisor,
        date: input.date,
        dailyGoal: input.dailyGoal,
        bond,
        meals: input.meals,
      }),
    );
    await upsertAdvisorComment({
      userId: input.userId,
      date: input.date,
      advisorId,
      recordHash,
      comment: text,
    });
    return { kind: "comment", advisorId, text, cached: false };
  } catch (error) {
    return failureView(error);
  }
}
