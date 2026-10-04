import { getAdvisor, type AdvisorId } from "@/lib/advisors";
import { generateAdvisorComment } from "@/lib/claude";
import {
  shareReplyFallback,
  shareSituationByText,
  type ShareSituationText,
} from "@/lib/share-situations";
import {
  SHARE_TEXT_LIMIT,
  SHARE_TONE,
  cleanShareText,
  shareTextHasPrivateDetail,
  shareTextLength,
} from "@/lib/share-text";
import { createAdminClient } from "@/lib/supabase/admin";

function cacheUnavailable(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return /schema cache|does not exist|Could not find/i.test(message);
}

function inCharacter(characterId: AdvisorId, text: string) {
  if (characterId === "sharp") {
    return text.includes("ニャ") && !/です|ます|頑張ろう/.test(text);
  }
  if (characterId === "kansai") {
    return /やね|やで|やわ|ええ|んや|なぁ/.test(text);
  }
  if (characterId === "coach") {
    return /拙者|お主|見事|いたすな|労/.test(text);
  }
  if (characterId === "clerical") {
    return /推|尊/.test(text);
  }
  return /ありがとう|応援|知って/.test(text);
}

function polishShareReply(characterId: AdvisorId, text: string) {
  if (characterId !== "sharp" || !text.includes("珍しいじゃない")) {
    return text;
  }
  return text.replaceAll("珍しいじゃない", "やるじゃない");
}

function acceptableReply(characterId: AdvisorId, text: string) {
  return Boolean(text) && shareTextLength(text) <= SHARE_TEXT_LIMIT && !shareTextHasPrivateDetail(text, []) && inCharacter(characterId, text);
}

async function readCachedReply(characterId: AdvisorId, situation: ShareSituationText) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("share_reply_cache")
    .select("text")
    .eq("character_id", characterId)
    .eq("situation", situation)
    .maybeSingle();
  if (error) {
    if (cacheUnavailable(error)) {
      return null;
    }
    throw new Error(error.message);
  }
  return typeof data?.text === "string" && acceptableReply(characterId, data.text) ? data.text : null;
}

async function writeCachedReply(characterId: AdvisorId, situation: ShareSituationText, text: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("share_reply_cache").upsert(
    { character_id: characterId, situation, text },
    { onConflict: "character_id,situation" },
  );
  if (error && !cacheUnavailable(error)) {
    throw new Error(error.message);
  }
}

async function generateReply(characterId: AdvisorId, situation: ShareSituationText) {
  const advisor = getAdvisor(characterId);
  let previous = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = `${advisor.name}として、相手のひとことに40文字以内で返事を一つ書いてください。
相手のひとこと: ${situation}
口調: ${SHARE_TONE[characterId]}
この口調から外れた返事は使わない。別人の励まし口調にしない。
絶対に守ること:
- 数字、日付、食事の名前、体重、カロリー、BMI、メールアドレス、個人名を入れない
- 病気になる、寿命が縮む、といった将来の健康の断定や脅しを入れない
- 体型や容姿をけなさない
- 選んだ状況に寄り添い、最後は温かい一言で終える
- ツンデレ猫が認めるときは「珍しいじゃない」は使わず、「やるじゃない」のようにする。突き放さず、最後に温かさを残す
- 返事だけを返す。説明、カギかっこ、見出しは付けない
${previous ? `前回は使えませんでした。理由: ${previous}。条件を守って作り直してください。` : ""}`;
    try {
      const raw = polishShareReply(characterId, cleanShareText(await generateAdvisorComment(prompt, 120)));
      if (!raw) {
        previous = "空でした";
        continue;
      }
      if (!acceptableReply(characterId, raw)) {
        previous = "数字か、長すぎる文か、使えない言葉が入っていました";
        continue;
      }
      return raw;
    } catch {
      return null;
    }
  }
  return null;
}

export async function loadSituationReply(characterId: AdvisorId, situation: ShareSituationText) {
  const situationItem = shareSituationByText(situation);
  if (!situationItem) {
    throw new Error("Unknown share situation");
  }
  const cached = await readCachedReply(characterId, situation);
  if (cached) {
    const polished = polishShareReply(characterId, cached);
    if (polished !== cached) {
      await writeCachedReply(characterId, situation, polished).catch(() => undefined);
    }
    return polished;
  }
  const generated = await generateReply(characterId, situation);
  if (generated) {
    try {
      await writeCachedReply(characterId, situation, generated);
    } catch {
      return generated;
    }
    return generated;
  }
  return shareReplyFallback(characterId, situationItem.id);
}
