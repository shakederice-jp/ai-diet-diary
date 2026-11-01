import { APP_NAME } from "@/lib/app-title";

export const X_POST_LIMIT = 280;
export const SHARE_POST_CHEER = "同じように頑張ってる人、一緒に続けよう";
export const SHARE_POST_HASHTAGS = `#ダイエット記録 #ダイエット仲間 #${APP_NAME}`;

const URL_PATTERN = /https?:\/\/[^\s]+/g;
const SENTENCE_END = new Set(["。", "！", "？"]);

export type SharePostInput = {
  shareText: string;
  reply: string;
  advisorName: string;
  url: string;
};

export type SharePost = {
  text: string;
  shortened: boolean;
  weight: number;
};

function isHalfwidth(char: string) {
  const code = char.codePointAt(0) ?? 0;
  if (code <= 0x007f) {
    return true;
  }
  return code >= 0xff61 && code <= 0xffdc;
}

/** 全角は2、半角は1、URLは23。Xの280以内に収めるための重み。 */
export function xWeightedLength(text: string) {
  const urls: string[] = [];
  const rest = text.replace(URL_PATTERN, (url) => {
    urls.push(url);
    return "";
  });
  let weight = urls.length * 23;
  for (const char of Array.from(rest)) {
    weight += isHalfwidth(char) ? 1 : 2;
  }
  return weight;
}

function firstSentence(reply: string) {
  let sentence = "";
  for (const char of Array.from(reply.trim())) {
    sentence += char;
    if (SENTENCE_END.has(char)) {
      return sentence;
    }
  }
  return sentence;
}

/** 最初の1文。40文字を超えるときは読点で切り、なければ40文字で切って「…」を付ける。 */
export function replyExcerpt(reply: string) {
  const sentence = firstSentence(reply);
  const chars = Array.from(sentence);
  if (chars.length <= 40) {
    return sentence;
  }
  const window = chars.slice(0, 40).join("");
  const cut = window.lastIndexOf("、");
  if (cut >= 1) {
    return `${window.slice(0, cut)}…`;
  }
  return `${window}…`;
}

function shortenExcerpt(reply: string, max: number) {
  const sentence = firstSentence(reply);
  const chars = Array.from(sentence);
  if (chars.length <= max) {
    return sentence;
  }
  const room = Math.max(1, max - 1);
  const window = chars.slice(0, room).join("");
  const cut = window.lastIndexOf("、");
  const base = cut >= 1 ? window.slice(0, cut) : chars.slice(0, room).join("");
  const next = `${base}…`;
  if (Array.from(next).length <= max) {
    return next;
  }
  return `${chars.slice(0, Math.max(0, max - 1)).join("")}…`;
}

function postWeight(text: string, url: string) {
  if (url) {
    return xWeightedLength(text);
  }
  return xWeightedLength(text) + (text ? 24 : 23);
}

function assemble(input: {
  shareText: string;
  replyExcerpt: string;
  advisorName: string;
  includeCheer: boolean;
  url: string;
}) {
  const lines: string[] = [];
  const share = input.shareText.trim();
  if (share) {
    lines.push(share);
  }
  if (input.replyExcerpt) {
    lines.push(`🐱${input.advisorName}「${input.replyExcerpt}」`);
  }
  if (input.includeCheer) {
    lines.push(SHARE_POST_CHEER);
  }
  lines.push(SHARE_POST_HASHTAGS);
  if (input.url) {
    lines.push(input.url);
  }
  return lines.join("\n");
}

function lastBreak(slice: string) {
  const marks = ["。", "！", "？", "、", " "];
  let at = -1;
  for (const mark of marks) {
    at = Math.max(at, slice.lastIndexOf(mark));
  }
  return at;
}

function shrinkShareLine(line: string, fits: (next: string) => boolean) {
  const chars = Array.from(line.trim());
  if (chars.length === 0) {
    return "";
  }
  if (fits(line.trim())) {
    return line.trim();
  }
  for (let length = chars.length - 1; length >= 1; length -= 1) {
    const slice = chars.slice(0, length).join("");
    const markAt = lastBreak(slice);
    if (markAt < 1) {
      continue;
    }
    const base = slice.slice(0, markAt).replace(/[。！？、\s]+$/u, "");
    if (!base) {
      continue;
    }
    const candidate = `${base}…`;
    if (fits(candidate)) {
      return candidate;
    }
  }
  for (let length = chars.length - 1; length >= 1; length -= 1) {
    const candidate = `${chars.slice(0, length).join("")}…`;
    if (fits(candidate)) {
      return candidate;
    }
  }
  return "…";
}

export function buildXPost(input: SharePostInput): SharePost {
  const shareText = input.shareText.trim();
  const reply = input.reply.trim();
  const url = input.url.trim();
  const name = input.advisorName;
  const fullExcerpt = reply ? replyExcerpt(reply) : "";

  const make = (excerpt: string, includeCheer: boolean, line: string) =>
    assemble({
      shareText: line,
      replyExcerpt: excerpt,
      advisorName: name,
      includeCheer,
      url,
    });

  const within = (text: string) => postWeight(text, url) <= X_POST_LIMIT;
  const full = make(fullExcerpt, true, shareText);
  if (within(full)) {
    return { text: full, shortened: false, weight: postWeight(full, url) };
  }

  let excerpt = fullExcerpt;
  if (excerpt) {
    for (let max = Array.from(excerpt).length - 1; max >= 15; max -= 1) {
      excerpt = shortenExcerpt(reply, max);
      const text = make(excerpt, true, shareText);
      if (within(text)) {
        return { text, shortened: true, weight: postWeight(text, url) };
      }
    }
  }

  const withoutCheer = make(excerpt, false, shareText);
  if (within(withoutCheer)) {
    return { text: withoutCheer, shortened: true, weight: postWeight(withoutCheer, url) };
  }

  const line = shrinkShareLine(shareText, (next) => within(make(excerpt, false, next)));
  const text = make(excerpt, false, line);
  return { text, shortened: true, weight: postWeight(text, url) };
}
