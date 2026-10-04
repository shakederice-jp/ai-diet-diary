export const SHARE_BRAND = "AIダイエットマネジメント手帳";
export const SHARE_DOMAIN = "diet.finance-tower.com";
export const SHARE_DISCLAIMER = "AIによる一般的な情報です";

export const SHARE_SITUATIONS = [
  { id: "night-feast", text: "夜にがっつり食べてしまった" },
  { id: "snack-ok", text: "間食を我慢できた" },
  { id: "eating-out", text: "外食だったけど頑張った" },
  { id: "back", text: "少し休んだけど戻ってきた" },
  { id: "steady", text: "体重は変わらないけど記録は続けている" },
  { id: "recorded", text: "今日もちゃんと記録できた" },
] as const;

export type ShareSituationId = (typeof SHARE_SITUATIONS)[number]["id"];
export type ShareSituationText = (typeof SHARE_SITUATIONS)[number]["text"];
export type ShareCharacterId = "sharp" | "kind" | "clerical" | "coach" | "kansai";

export const DEFAULT_SHARE_SITUATION_ID: ShareSituationId = "recorded";

const WEIGHT_LABEL = /^スタートから (−[0-9]{1,3}\.[0-9]kg|±0kg)$/;

const FALLBACKS: Record<ShareCharacterId, Record<ShareSituationId, string>> = {
  sharp: {
    "night-feast": "夜に食べても、記録できたのはえらいニャ。",
    "snack-ok": "がまんできたの、ちゃんと見てるニャ。",
    "eating-out": "外でも頑張ったのね。えらいニャ。",
    back: "戻ってきただけで、じゅうぶんえらいニャ。",
    steady: "記録が続いてるの、えらいニャ。",
    recorded: "今日も記録できたの、えらいニャ。",
  },
  kind: {
    "night-feast": "食べた日も、記録してくれてありがとう。",
    "snack-ok": "がまんできたこと、未来のわたしは知ってる。",
    "eating-out": "外でも自分を大切にしたね。ありがとう。",
    back: "戻ってきてくれて、ほんとうにありがとう。",
    steady: "記録を続けてくれて、ありがとう。",
    recorded: "今日の記録、届いたよ。ありがとう。",
  },
  clerical: {
    "night-feast": "食べた日も記録したの、尊い…！推せます。",
    "snack-ok": "がまんして記録したの、尊い。推してる。",
    "eating-out": "外でも向き合えたの、尊い…！推せます。",
    back: "戻ってきたの、尊い。今日のあなたも推しです。",
    steady: "記録を続けてるの、尊い。ずっと推してる。",
    recorded: "今日も記録、尊い…！ちゃんと推せます。",
  },
  coach: {
    "night-feast": "食べた日も残した。見事であった。",
    "snack-ok": "がまん、見事。拙者、お主を労うぞ。",
    "eating-out": "外にても、よう堪えた。見事であった。",
    back: "戻りしこと、見事。無理はいたすな。",
    steady: "記録を続けしこと、見事であった。",
    recorded: "今日の記録、見事。お主はよくやっておる。",
  },
  kansai: {
    "night-feast": "食べた日も残してくれて、えらいわ。大丈夫やで。",
    "snack-ok": "がまんできたんやね。よう頑張ったなぁ。",
    "eating-out": "外でも頑張ったんやね。えらいえらい。",
    back: "戻ってきてくれて嬉しいわ。無理せんでええで。",
    steady: "記録、続いてるんやね。えらいわ。",
    recorded: "今日も残してくれて嬉しいわ。よう頑張ったなぁ。",
  },
};

export function isShareCharacterId(value: string): value is ShareCharacterId {
  return value === "sharp" || value === "kind" || value === "clerical" || value === "coach" || value === "kansai";
}

export function isShareSituationId(value: string): value is ShareSituationId {
  return SHARE_SITUATIONS.some((item) => item.id === value);
}

export function shareSituationById(id: string) {
  return SHARE_SITUATIONS.find((item) => item.id === id) ?? null;
}

export function shareSituationByText(text: string) {
  return SHARE_SITUATIONS.find((item) => item.text === text) ?? null;
}

export function situationBubble(text: string) {
  return `${text}…`;
}

export function shareEmoji(characterId: ShareCharacterId) {
  if (characterId === "sharp") return "🐱";
  if (characterId === "kind") return "✨";
  if (characterId === "clerical") return "💗";
  if (characterId === "coach") return "🗡️";
  return "🧡";
}

export function sharePostText(situation: string, advisorName: string, characterId: ShareCharacterId) {
  return `${situation}…。でも、${advisorName}に励まされた${shareEmoji(characterId)} #ダイエット記録 #ダイエット仲間 #AIダイエット手帳\n同じように頑張ってる人、一緒に続けよう`;
}

export function shareReplyFallback(characterId: ShareCharacterId, situationId: ShareSituationId) {
  return FALLBACKS[characterId][situationId];
}

export function formatShareWeightLabel(startKg: number, latestKg: number) {
  if (!(startKg > 0) || !(latestKg > 0)) {
    return null;
  }
  const delta = Math.round((latestKg - startKg) * 10) / 10;
  if (!Number.isFinite(delta) || delta > 0) {
    return null;
  }
  if (delta === 0) {
    return "スタートから ±0kg";
  }
  const kilos = Math.abs(delta);
  if (kilos >= 1000) {
    return null;
  }
  return `スタートから −${kilos.toFixed(1)}kg`;
}

export function isShareWeightLabel(value: unknown): value is string {
  return typeof value === "string" && WEIGHT_LABEL.test(value);
}

export function visibleStreakDays(showStreak: boolean, streakDays: number) {
  if (!showStreak || !Number.isInteger(streakDays) || streakDays <= 1) {
    return null;
  }
  return streakDays;
}
