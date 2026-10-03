import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { getAdvisor, isAdvisorId, type AdvisorId } from "@/lib/advisors";
import { tokyoToday } from "@/lib/calendar";
import { generateAdvisorComment } from "@/lib/claude";
import { listMeals } from "@/lib/meals";
import { getAdvisorComment } from "@/lib/advisor-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDataClient } from "@/lib/supabase/server";
import {
  SHARE_TEXT_LIMIT,
  SHARE_TONE,
  cleanShareText,
  redactComment,
  shareTextHasPrivateDetail,
  shareTextLength,
} from "@/lib/share-text";

export const SHARE_DAILY_LIMIT = 10;
export const SHARE_BRAND = "AIダイエットマネジメント手帳";
export const SHARE_DOMAIN = "diet.finance-tower.com";
export const SHARE_DISCLAIMER = "AIによる一般的な情報です";

export type ShareCard = {
  id: string;
  characterId: AdvisorId;
  text: string;
  createdAt: string;
};

export type OwnedShareCard = ShareCard;

function missingTable(error: { message?: string } | null) {
  return /schema cache|does not exist|Could not find the table/i.test(error?.message ?? "");
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

async function findOwnedCard(userId: string, sourceHash: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("share_card_owners")
    .select("card_id, share_cards(id, character_id, text, created_at)")
    .eq("user_id", userId)
    .eq("source_hash", sourceHash)
    .maybeSingle();
  if (error) {
    if (missingTable(error)) {
      return { missing: true as const, card: null };
    }
    throw new Error(error.message);
  }
  const joined = data?.share_cards;
  const row = Array.isArray(joined) ? joined[0] : joined;
  if (!row || !isAdvisorId(row.character_id)) {
    return { missing: false as const, card: null };
  }
  return {
    missing: false as const,
    card: {
      id: row.id,
      characterId: row.character_id,
      text: row.text,
      createdAt: row.created_at,
    } satisfies ShareCard,
  };
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
    if (missingTable(error)) {
      return null;
    }
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function shortenComment(characterId: AdvisorId, comment: string, mealNames: string[]) {
  const advisor = getAdvisor(characterId);
  const source = redactComment(comment, mealNames);
  let previous = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = `次の文章を、${advisor.name}の口調で、${SHARE_TEXT_LIMIT}文字以内のひとことにしてください。
口調: ${SHARE_TONE[characterId]}
絶対に守ること:
- 数字、日付、食事の名前、体重、カロリー、BMI、目標値、メールアドレス、個人名を入れない
- 病気になる、寿命が縮む、といった将来の健康の断定や脅しを入れない
- 体型や容姿をけなさない
- ひとことだけを返す。説明、カギかっこ、見出しは付けない
${previous ? `前回は使えませんでした。理由: ${previous}。条件を守って作り直してください。` : ""}
文章:
${source}`;
    const raw = cleanShareText(await generateAdvisorComment(prompt, 120));
    const text = shareTextLength(raw) > SHARE_TEXT_LIMIT ? Array.from(raw).slice(0, SHARE_TEXT_LIMIT).join("") : raw;
    if (!text) {
      previous = "空でした";
      continue;
    }
    if (shareTextHasPrivateDetail(text, mealNames) || shareTextLength(text) > SHARE_TEXT_LIMIT) {
      previous = "数字か食事の名前か、長すぎる文が入っていました";
      continue;
    }
    return text;
  }
  return null;
}

export async function createShareCardForDate(userId: string, date: string) {
  const stored = await getAdvisorComment(userId, date);
  if (!stored?.comment.trim()) {
    return { ok: false as const, error: "この日のコメントがまだないので、シェアできません。" };
  }
  const meals = await listMeals(userId, date);
  const mealNames = meals.map((meal) => meal.name);
  const sourceHash = createHash("sha256")
    .update(`${stored.advisorId}\n${stored.recordHash}\n${stored.comment}`)
    .digest("hex");

  const existing = await findOwnedCard(userId, sourceHash);
  if (existing.missing) {
    return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
  }
  if (existing.card) {
    return { ok: true as const, card: existing.card, reused: true };
  }

  const madeToday = await countToday(userId);
  if (madeToday === null) {
    return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
  }
  if (madeToday >= SHARE_DAILY_LIMIT) {
    return { ok: false as const, error: "きょうのシェアは10回までです。あしたまた作れます。" };
  }

  const text = await shortenComment(stored.advisorId, stored.comment, mealNames);
  if (!text || shareTextHasPrivateDetail(text, mealNames)) {
    return { ok: false as const, error: "数字や食事の名前を入れずに短くできませんでした。もう一度お試しください。" };
  }

  const admin = createAdminClient();
  const id = randomBytes(18).toString("base64url");
  const cardInsert = await admin.from("share_cards").insert({
    id,
    character_id: stored.advisorId,
    text,
  });
  if (cardInsert.error) {
    if (missingTable(cardInsert.error)) {
      return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
    }
    throw new Error(cardInsert.error.message);
  }
  const ownerInsert = await admin.from("share_card_owners").insert({
    card_id: id,
    user_id: userId,
    source_hash: sourceHash,
  });
  if (ownerInsert.error) {
    await admin.from("share_cards").delete().eq("id", id);
    if (ownerInsert.error.code === "23505") {
      const again = await findOwnedCard(userId, sourceHash);
      if (again.card) {
        return { ok: true as const, card: again.card, reused: true };
      }
    }
    throw new Error(ownerInsert.error.message);
  }
  const creationInsert = await admin.from("share_card_creations").insert({ user_id: userId });
  if (creationInsert.error) {
    await admin.from("share_cards").delete().eq("id", id);
    if (missingTable(creationInsert.error)) {
      return { ok: false as const, error: "シェア用のテーブルがありません。マイグレーションを適用してください。" };
    }
    throw new Error(creationInsert.error.message);
  }

  return {
    ok: true as const,
    reused: false,
    card: {
      id,
      characterId: stored.advisorId,
      text,
      createdAt: new Date().toISOString(),
    } satisfies ShareCard,
  };
}

export async function getPublicShareCard(id: string): Promise<ShareCard | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    return null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("share_cards")
    .select("id, character_id, text, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data || !isAdvisorId(data.character_id)) {
    return null;
  }
  return {
    id: data.id,
    characterId: data.character_id,
    text: data.text,
    createdAt: data.created_at,
  };
}

export async function listOwnShareCards(userId: string): Promise<OwnedShareCard[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("share_card_owners")
    .select("created_at, share_cards(id, character_id, text, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    if (missingTable(error)) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).flatMap((row) => {
    const joined = row.share_cards;
    const card = Array.isArray(joined) ? joined[0] : joined;
    if (!card || !isAdvisorId(card.character_id)) {
      return [];
    }
    return [
      {
        id: card.id,
        characterId: card.character_id,
        text: card.text,
        createdAt: card.created_at,
      },
    ];
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
    if (missingTable(owned.error)) {
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
