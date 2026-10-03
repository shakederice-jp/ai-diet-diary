import type { AdvisorId } from "@/lib/advisors";

export const SHARE_TEXT_LIMIT = 40;

const PRIVATE_DETAIL = /[0-9０-９]|kcal|kg|bmi|カロリー|体重|キロ/i;
const HARMFUL = /病気|寿命|死ぬ|糖尿病|デブ|ブス|醜|太り|痩せろ/;

export function shareTextLength(text: string) {
  return Array.from(text).length;
}

export function cleanShareText(raw: string) {
  return raw
    .replace(/```/g, "")
    .replace(/^["「『]|["」』]$/g, "")
    .replace(/[\r\n]+/g, "")
    .trim();
}

export function shareTextHasPrivateDetail(text: string, mealNames: string[]) {
  if (PRIVATE_DETAIL.test(text) || HARMFUL.test(text) || text.includes("@")) {
    return true;
  }
  return mealNames.some((name) => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && text.includes(trimmed);
  });
}

export function redactComment(comment: string, mealNames: string[]) {
  let text = comment.replace(/[0-9０-９]+/g, "").replace(/kcal|kg|bmi|カロリー|体重/gi, "");
  for (const name of mealNames) {
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      text = text.split(trimmed).join("");
    }
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

export const SHARE_TONE: Record<AdvisorId, string> = {
  sharp: "素っ気ない猫。語尾のニャは一つまで。最後は照れながらの優しさ。",
  kind: "未来の自分が過去の自分に語る。感謝と応援だけ。病気や寿命の話はしない。",
  clerical: "記録を尊敬するファン。恋人のふるまいや依存はしない。",
  coach: "時代劇の武士。精神論で追い込まず、最後は労い。",
  kansai: "世話焼きで温かい関西のおかん。最後は安心させる。",
};
