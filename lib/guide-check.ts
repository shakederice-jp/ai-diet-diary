import { GUIDE_CHAPTERS } from "@/lib/guide-chapters";
import { GUIDE_SOURCES, guideSourceById } from "@/lib/guide-sources";

export type GuideSourceRecord = {
  id: string;
  type: string;
  publisher: string;
  title: string;
  url: string;
  checkedAt: string;
};

export type GuideArticleRecord = {
  slug: string;
  chapter: string;
  sources?: readonly { id: string; note?: string }[] | null;
  needsOfficial?: boolean;
  blocks?: readonly unknown[];
};

const CHAPTER_SLUGS = new Set<string>(GUIDE_CHAPTERS.map((chapter) => chapter.slug));

function citesInBlock(block: unknown) {
  if (!block || typeof block !== "object" || !("cites" in block)) {
    return [];
  }
  const cites = block.cites;
  if (!Array.isArray(cites)) {
    return [];
  }
  return cites.filter((item): item is number => typeof item === "number");
}

export function guideSourceRecordErrors(sources: readonly GuideSourceRecord[]) {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    if (seen.has(source.id)) {
      errors.push(`出典 id「${source.id}」が重複しています。`);
    }
    seen.add(source.id);
    if (!source.publisher.trim() || !source.title.trim()) {
      errors.push(`出典「${source.id}」の発行元またはタイトルが空です。`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt)) {
      errors.push(`出典「${source.id}」の確認日が不正です。`);
    }
    if (source.type === "internal") {
      if (!source.url.startsWith("/")) {
        errors.push(`出典「${source.id}」のURLはサイト内のパス（/ で始まる）である必要があります。`);
      }
    } else if (!source.url.startsWith("https://")) {
      errors.push(`出典「${source.id}」のURLは https:// で始まる必要があります。`);
    }
  }
  return errors;
}

export function guideArticleRecordReport(articles: readonly GuideArticleRecord[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const slugs = new Set<string>();

  for (const article of articles) {
    if (slugs.has(article.slug)) {
      errors.push(`記事 slug「${article.slug}」が重複しています。`);
    }
    slugs.add(article.slug);
    if (article.slug === "theme") {
      errors.push("記事の slug に予約語「theme」は使えません。");
    }
    if (CHAPTER_SLUGS.has(article.slug)) {
      errors.push(`記事の slug「${article.slug}」は章の slug と重なっています。`);
    }
    if (!CHAPTER_SLUGS.has(article.chapter)) {
      errors.push(`記事「${article.slug}」の章「${article.chapter}」は定義されていません。`);
    }
    const sources = article.sources ?? [];
    if (sources.length === 0) {
      errors.push(`記事「${article.slug}」の出典（sources）が空です。1件以上必要です。`);
    }
    let official = 0;
    for (const ref of sources) {
      const source = guideSourceById(ref.id);
      if (!source) {
        errors.push(`記事「${article.slug}」の出典 id「${ref.id}」は台帳にありません。`);
        continue;
      }
      if (source.type === "official") {
        official += 1;
      }
    }
    for (const block of article.blocks ?? []) {
      for (const number of citesInBlock(block)) {
        if (!Number.isInteger(number) || number < 1 || number > sources.length) {
          errors.push(
            `記事「${article.slug}」の出典番号 ${String(number)} は、出典の件数（${sources.length}）の範囲外です。`,
          );
        }
      }
    }
    if (article.needsOfficial && official === 0) {
      warnings.push(
        `記事「${article.slug}」は栄養・健康に関する本文（needsOfficial）ですが、type: official の出典がありません。`,
      );
    }
  }

  return { errors, warnings };
}

/** ビルド時・テスト時に呼ぶ。出典の欠落や未知の id は例外、official 不足は警告。 */
export function assertGuideCatalog(
  articles: readonly GuideArticleRecord[],
  warn: (message: string) => void = console.warn,
) {
  const report = guideArticleRecordReport(articles);
  const errors = [...guideSourceRecordErrors(GUIDE_SOURCES), ...report.errors];
  for (const warning of report.warnings) {
    warn(warning);
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
