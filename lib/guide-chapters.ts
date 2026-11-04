/** ガイドの章。slug「theme」は /guide/theme/[chapter] 用の予約で、記事の slug には使わない。 */

export const GUIDE_CHAPTERS = [
  {
    key: "A",
    slug: "worries",
    name: "悩みに答える",
    description:
      "続かない、食べすぎた、体重が動かない。ダイエットの記録でつまずきやすい場面ごとに、考え方と対処を整理します。",
    order: 1,
  },
  {
    key: "B",
    slug: "basics",
    name: "基礎知識",
    description:
      "カロリー、体重の増減、体脂肪率など、記録を続けるために知っておきたい基本を、出典つきで解説します。数値を断定する記事では、末尾に出典を示します。",
    order: 2,
  },
  {
    key: "C",
    slug: "seasons",
    name: "季節・場面",
    description:
      "年末年始や新生活など、食生活が変わりやすい時期や場面での、記録と調整の考え方です。特別な食べ方を勧める章ではなく、記録を続けるための見方をまとめます。",
    order: 3,
  },
  {
    key: "D",
    slug: "calorie-guides",
    name: "カロリー目安",
    description:
      "外食、お菓子、主食、飲み物など、食べ物ごとのカロリーの目安をまとめたガイドです。数値は目安で、店や商品、量によって変わります。",
    order: 4,
  },
  {
    key: "E",
    slug: "using-memolever",
    name: "メモレバの使い方",
    description:
      "メモレバの機能と使い方、AIの仕組みと限界、続けるための工夫を紹介します。細かい操作の手順は、使い方のページにもまとめています。",
    order: 5,
  },
] as const;

export type GuideChapter = (typeof GUIDE_CHAPTERS)[number];
export type GuideChapterSlug = GuideChapter["slug"];
export type GuideChapterKey = GuideChapter["key"];

/** この本数未満の章一覧は準備中（noindex、sitemap 対象外）。 */
export const GUIDE_CHAPTER_PUBLISH_MIN = 3;

export function orderedGuideChapters() {
  return [...GUIDE_CHAPTERS].sort((a, b) => a.order - b.order);
}

export function guideChapterBySlug(slug: string) {
  return GUIDE_CHAPTERS.find((chapter) => chapter.slug === slug) ?? null;
}

export function guideChapterPath(slug: GuideChapterSlug) {
  return `/guide/theme/${slug}`;
}
