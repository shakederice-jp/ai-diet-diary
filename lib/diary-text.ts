export function textLength(value: string) {
  return Array.from(value).length;
}

export function clipText(value: string, max: number) {
  const chars = Array.from(value);
  if (chars.length <= max) {
    return value;
  }
  return chars.slice(0, max).join("");
}

/** 日記の先頭を、80文字以内の自然な区切りで切る。長いときは「…」を付ける。 */
export function shareExcerpt(body: string) {
  const compact = body.replace(/\s+/g, " ").trim();
  if (textLength(compact) <= 80) {
    return compact;
  }
  const window = clipText(compact, 80);
  const marks = ["。", "、", " ", "！", "？"];
  let cut = -1;
  for (const mark of marks) {
    cut = Math.max(cut, window.lastIndexOf(mark));
  }
  const base = cut >= 20 ? window.slice(0, cut) : clipText(window, 79);
  return `${base.replace(/[。、！？\s]+$/u, "")}…`;
}
