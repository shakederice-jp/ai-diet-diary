import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { getAdvisor, isAdvisorId, type AdvisorId } from "@/lib/advisors";
import { getAdvisorComment } from "@/lib/advisor-store";
import { tokyoToday } from "@/lib/calendar";
import { loadStreakDays } from "@/lib/engagement";
import { loadSituationReply } from "@/lib/share-reply";
import {
  DEFAULT_SHARE_SITUATION_ID,
  formatShareWeightLabel,
  isShareSituationId,
  isShareWeightLabel,
  sharePostText,
  shareSituationById,
  shareSituationByText,
  visibleStreakDays,
  type ShareSituationId,
  type ShareSituationText,
} from "@/lib/share-situations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDataClient } from "@/lib/supabase/server";
import { getCalorieGoal } from "@/lib/user-settings";

export const SHARE_DAILY_LIMIT = 10;
export { SHARE_BRAND, SHARE_DISCLAIMER, SHARE_DOMAIN } from "@/lib/share-situations";

const CARD_COLUMNS =
  "id, character_id, text, created_at, situation, streak_days, weight_label, show_streak, show_weight";
const LEGACY_COLUMNS = "id, character_id, text, created_at";

export type ShareCard = {
  id: string;
  characterId: AdvisorId;
  text: string;
  situation: ShareSituationText | null;
  showStreak: boolean;
  showWeight: boolean;
  streakDays: number | null;
  weightLabel: string | null;
  createdAt: string;
};

export type ShareDraft = {
  characterId: AdvisorId;
  name: string;
  streakDays: number;
  weightLabel: string | null;
  situationId: ShareSituationId;
  showStreak: boolean;
  showWeight: boolean;
  reply: string | null;
  card: ShareCard | null;
};

export type OwnedShareCard = ShareCard;

type CardRow = {
  id: string;
  character_id: string;
  text: string;
  created_at: string;
  situation?: string | null;
  streak_days?: number | null;
  weight_label?: string | null;
  show_streak?: boolean | null;
  show_weight?: boolean | null;
};

function storageProblem(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return /schema cache|does not exist|Could not find the table|Could not find the '.+' column/i.test(message);
}

export async function appOrigin() {
  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "")
    .split(",")[0]
    .trim();
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (!host) {
    return "https://diet.finance-tower.com";
  }
  return `${proto}://${host}`;
}

export function sharePagePath(id: string) {
  return `/s/${id}`;
}

function mapCard(row: CardRow): ShareCard | null {
  if (!isAdvisorId(row.character_id) || typeof row.text !== "string" || !row.text.trim()) {
    return null;
  }
  const situation = shareSituationByText(row.situation ?? "");
  const showStreak = row.show_streak !== false;
  const showWeight = row.show_weight === true;
  const streakDays =
    situation && showStreak && typeof row.streak_days === "number" && row.streak_days >= 2
      ? row.streak_days
      : null;
  const weightLabel = situation && showWeight && isShareWeightLabel(row.weight_label) ? row.weight_label : null;
  return {
    id: row.id,
    characterId: row.character_id,
    text: row.text,
    situation: situation?.text ?? null,
    showStreak: situation ? showStreak : false,
    showWeight: situation ? showWeight : false,
    streakDays,
    weightLabel,
    createdAt: row.created_at,
  };
}

async function selectCard(id: string) {
  const admin = createAdminClient();
  const full = await admin.from("share_cards").select(CARD_COLUMNS).eq("id", id).maybeSingle();
  if (!full.error) {
    return { row: (full.data as CardRow | null) ?? null, legacy: false };
  }
  if (!storageProblem(full.error)) {
    throw new Error(full.error.message);
  }
  const legacy = await admin.from("share_cards").select(LEGACY_COLUMNS).eq("id", id).maybeSingle();
  if (legacy.error) {
    if (storageProblem(legacy.error)) {
      return { row: null, legacy: true };
    }
    throw new Error(legacy.error.message);
  }
  return { row: (legacy.data as CardRow | null) ?? null, legacy: true };
}

async function findOwnedCard(userId: string, sourceHash: string) {
  const admin = createAdminClient();
  const full = await admin
    .from("share_card_owners")
    .select(`card_id, share_cards(${CARD_COLUMNS})`)
    .eq("user_id", userId)
    .eq("source_hash", sourceHash)
    .maybeSingle();
  if (full.error) {
    if (!storageProblem(full.error)) {
      throw new Error(full.error.message);
    }
    const legacy = await admin
      .from("share_card_owners")
      .select(`card_id, share_cards(${LEGACY_COLUMNS})`)
      .eq("user_id", userId)
      .eq("source_hash", sourceHash)
      .maybeSingle();
    if (legacy.error) {
      if (storageProblem(legacy.error)) {
        return { missing: true as const, card: null };
      }
      throw new Error(legacy.error.message);
    }
    return { missing: false as const, card: joinedCard(legacy.data?.share_cards) };
  }
  return { missing: false as const, card: joinedCard(full.data?.share_cards) };
}

function joinedCard(joined: CardRow | CardRow[] | null | undefined) {
  const row = Array.isArray(joined) ? joined[0] : joined;
  if (!row) {
    return null;
  }
  return mapCard(row);
}

async function countToday(userId: string) {
  const admin = createAdminClient();
  const start = new Date(`${tokyoToday().date}T00:00:00+09:00`).toISOString();
  const { count, error } = await admin
    .from("share_card_creations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start);
  if (error) {
    if (storageProblem(error)) {
      return null;
    }
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function requireOwnComment(userId: string, date: string) {
  const stored = await getAdvisorComment(userId, date);
  if (!stored?.comment.trim()) {
    return null;
  }
  const sourceHash = createHash("sha256")
    .update(`${stored.advisorId}\n${stored.recordHash}\n${stored.comment}`)
    .digest("hex");
  return { advisorId: stored.advisorId, sourceHash };
}

async function latestWeightKg(userId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("weight_records")
    .select("weight_kg")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  const weight = typeof data?.weight_kg === "number" ? data.weight_kg : Number(data?.weight_kg);
  return Number.isFinite(weight) ? weight : null;
}

async function currentWeightLabel(userId: string) {
  try {
    const [goal, latest] = await Promise.all([getCalorieGoal(userId), latestWeightKg(userId)]);
    if (!goal || latest == null) {
      return null;
    }
    return formatShareWeightLabel(goal.currentWeightKg, latest);
  } catch {
    return null;
  }
}

async function currentStreakDays(userId: string) {
  try {
    return await loadStreakDays(userId);
  } catch {
    return 0;
  }
}

export async function prepareShareDraft(userId: string, date: string): Promise<
  { ok: false; error: string } | { ok: true; draft: ShareDraft }
> {
  const comment = await requireOwnComment(userId, date);
  if (!comment) {
    return { ok: false, error: "この日のコメントがまだないので、シェアできません。" };
  }
  const [existing, streakDays, weightLabel] = await Promise.all([
    findOwnedCard(userId, comment.sourceHash),
    currentStreakDays(userId),
    currentWeightLabel(userId),
  ]);
  if (existing.missing) {
    return { ok: false, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
  }
  const saved = existing.card?.situation ? shareSituationByText(existing.card.situation) : null;
  return {
    ok: true,
    draft: {
      characterId: comment.advisorId,
      name: getAdvisor(comment.advisorId).name,
      streakDays,
      weightLabel,
      situationId: saved?.id ?? DEFAULT_SHARE_SITUATION_ID,
      showStreak: existing.card?.situation ? existing.card.showStreak : true,
      showWeight: existing.card?.situation ? existing.card.showWeight : false,
      reply: saved && existing.card ? existing.card.text : null,
      card: existing.card,
    },
  };
}

export async function replyForShare(userId: string, date: string, situationId: string) {
  const comment = await requireOwnComment(userId, date);
  if (!comment) {
    return { ok: false as const, error: "この日のコメントがまだないので、シェアできません。" };
  }
  const situation = shareSituationById(situationId);
  if (!situation) {
    return { ok: false as const, error: "状況を選び直してください。" };
  }
  const text = await loadSituationReply(comment.advisorId, situation.text);
  return { ok: true as const, text };
}

export async function publishShareCard(
  userId: string,
  date: string,
  input: { situationId: string; showStreak: boolean; showWeight: boolean },
) {
  if (!isShareSituationId(input.situationId)) {
    return { ok: false as const, error: "状況を選び直してください。" };
  }
  const situation = shareSituationById(input.situationId);
  if (!situation) {
    return { ok: false as const, error: "状況を選び直してください。" };
  }
  const comment = await requireOwnComment(userId, date);
  if (!comment) {
    return { ok: false as const, error: "この日のコメントがまだないので、シェアできません。" };
  }

  const [streakDays, weightChange] = await Promise.all([
    currentStreakDays(userId),
    currentWeightLabel(userId),
  ]);
  const publishedStreak = visibleStreakDays(input.showStreak, streakDays);
  const publishedWeight = input.showWeight ? weightChange : null;
  const text = await loadSituationReply(comment.advisorId, situation.text);
  const existing = await findOwnedCard(userId, comment.sourceHash);
  if (existing.missing) {
    return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
  }

  const admin = createAdminClient();
  const fields = {
    character_id: comment.advisorId,
    text,
    situation: situation.text,
    streak_days: publishedStreak,
    weight_label: publishedWeight,
    show_streak: input.showStreak,
    show_weight: input.showWeight,
  };

  if (existing.card) {
    const updated = await admin.from("share_cards").update(fields).eq("id", existing.card.id).select(CARD_COLUMNS).maybeSingle();
    if (updated.error) {
      if (storageProblem(updated.error)) {
        return { ok: false as const, error: "シェア用のテーブルを更新してください。マイグレーションを適用してください。" };
      }
      throw new Error(updated.error.message);
    }
    const card = updated.data ? mapCard(updated.data as CardRow) : null;
    if (!card) {
      return { ok: false as const, error: "シェアカードを作れませんでした。もう一度お試しください。" };
    }
    return { ok: true as const, card, postText: sharePostText(situation.text, getAdvisor(comment.advisorId).name, comment.advisorId) };
  }

  const madeToday = await countToday(userId);
  if (madeToday === null) {
    return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
  }
  if (madeToday >= SHARE_DAILY_LIMIT) {
    return { ok: false as const, error: "きょうのシェアは10回までです。あしたまた作れます。" };
  }

  const id = randomBytes(18).toString("base64url");
  const cardInsert = await admin.from("share_cards").insert({ id, ...fields });
  if (cardInsert.error) {
    if (storageProblem(cardInsert.error)) {
      return { ok: false as const, error: "シェア用のテーブルを更新してください。マイグレーションを適用してください。" };
    }
    throw new Error(cardInsert.error.message);
  }
  const ownerInsert = await admin.from("share_card_owners").insert({
    card_id: id,
    user_id: userId,
    source_hash: comment.sourceHash,
  });
  if (ownerInsert.error) {
    await admin.from("share_cards").delete().eq("id", id);
    if (ownerInsert.error.code === "23505") {
      const again = await findOwnedCard(userId, comment.sourceHash);
      if (again.card) {
        return {
          ok: true as const,
          card: again.card,
          postText: sharePostText(situation.text, getAdvisor(comment.advisorId).name, comment.advisorId),
        };
      }
    }
    throw new Error(ownerInsert.error.message);
  }
  const creationInsert = await admin.from("share_card_creations").insert({ user_id: userId });
  if (creationInsert.error) {
    await admin.from("share_cards").delete().eq("id", id);
    if (storageProblem(creationInsert.error)) {
      return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
    }
    throw new Error(creationInsert.error.message);
  }

  return {
    ok: true as const,
    card: {
      id,
      characterId: comment.advisorId,
      text,
      situation: situation.text,
      showStreak: input.showStreak,
      showWeight: input.showWeight,
      streakDays: publishedStreak,
      weightLabel: publishedWeight,
      createdAt: new Date().toISOString(),
    } satisfies ShareCard,
    postText: sharePostText(situation.text, getAdvisor(comment.advisorId).name, comment.advisorId),
  };
}

export async function getPublicShareCard(id: string): Promise<ShareCard | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    return null;
  }
  const selected = await selectCard(id);
  if (!selected.row) {
    return null;
  }
  return mapCard(selected.row);
}

export async function listOwnShareCards(userId: string): Promise<OwnedShareCard[]> {
  const supabase = createAdminClient();
  const full = await supabase
    .from("share_card_owners")
    .select(`created_at, share_cards(${CARD_COLUMNS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const data = full.error ? null : full.data;
  if (full.error) {
    if (!storageProblem(full.error)) {
      throw new Error(full.error.message);
    }
    const legacy = await supabase
      .from("share_card_owners")
      .select(`created_at, share_cards(${LEGACY_COLUMNS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (legacy.error) {
      if (storageProblem(legacy.error)) {
        return [];
      }
      throw new Error(legacy.error.message);
    }
    return (legacy.data ?? []).flatMap((row) => {
      const card = joinedCard(row.share_cards as CardRow | CardRow[] | null);
      return card ? [card] : [];
    });
  }
  return (data ?? []).flatMap((row) => {
    const card = joinedCard(row.share_cards as CardRow | CardRow[] | null);
    return card ? [card] : [];
  });
}

export async function deleteOwnShareCard(userId: string, id: string) {
  const supabase = await createDataClient();
  const owned = await supabase
    .from("share_card_owners")
    .select("card_id")
    .eq("user_id", userId)
    .eq("card_id", id)
    .maybeSingle();
  if (owned.error) {
    if (storageProblem(owned.error)) {
      return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
    }
    throw new Error(owned.error.message);
  }
  if (!owned.data) {
    return { ok: false as const, error: "このカードは削除できません。" };
  }
  const admin = createAdminClient();
  const removed = await admin.from("share_cards").delete().eq("id", id);
  if (removed.error) {
    throw new Error(removed.error.message);
  }
  return { ok: true as const };
}
