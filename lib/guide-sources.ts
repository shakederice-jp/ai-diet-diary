/** ガイド記事の出典台帳。ここに無い資料は、記事から参照しない。 */

export const GUIDE_SOURCE_TYPES = ["official", "company", "internal", "publication"] as const;

export type GuideSourceType = (typeof GUIDE_SOURCE_TYPES)[number];

export const GUIDE_COMPANY_SOURCE_NOTE = "各社の公式情報です。掲載内容は変更される場合があります。";

export const GUIDE_INTERNAL_SOURCE_LABEL = "メモレバ公式";

const CHECKED_ON = "2026-11-04";

export const GUIDE_SOURCES = [
  {
    id: "mext-food-composition-2023",
    type: "official",
    publisher: "文部科学省 科学技術・学術審議会 資源調査分科会",
    title: "日本食品標準成分表（八訂）増補2023年",
    url: "https://www.mext.go.jp/content/20230428-mxt_kagsei-mext_00001_011.pdf",
    checkedAt: CHECKED_ON,
  },
  {
    id: "mhlw-dri-2025",
    type: "official",
    publisher: "厚生労働省",
    title: "「日本人の食事摂取基準（2025年版）」策定検討会 報告書",
    url: "https://www.mhlw.go.jp/stf/newpage_44141.html",
    checkedAt: CHECKED_ON,
  },
  {
    id: "mhlw-sleep-guide-2023",
    type: "official",
    publisher: "厚生労働省",
    title: "健康づくりのための睡眠ガイド2023",
    url: "https://www.mhlw.go.jp/content/001305530.pdf",
    checkedAt: CHECKED_ON,
  },
  {
    id: "memolever-howto",
    type: "internal",
    publisher: "大手町調査室九課（メモレバ運営）",
    title: "このサイトの使い方",
    url: "/howto",
    checkedAt: CHECKED_ON,
  },
  {
    id: "caa-nutrition-labeling",
    type: "official",
    publisher: "消費者庁",
    title: "栄養成分表示について",
    url: "https://www.caa.go.jp/policies/policy/food_labeling/nutrient_declearation/",
    checkedAt: "2026-11-05",
  },
  {
    id: "tanita-us-fluctuation",
    type: "company",
    publisher: "TANITA US（TANITA Corporation of America, Inc.）",
    title: "Why Do My Measurements Change Throughout the Day? Understanding the Science Behind Fluctuations",
    url: "https://tanita.com/posts/why-do-my-measurements-change-throughout-the-day",
    checkedAt: "2026-11-05",
    note: "英語の解説（2026年3月10日公開）。メーカーの情報です。",
  },
  {
    id: "mhlw-dri-2025-summary",
    type: "official",
    publisher: "厚生労働省",
    title: "「日本人の食事摂取基準（2025年版）」概要資料（策定検討会報告書にもとづく・2025年2月）",
    url: "https://www.mhlw.go.jp/content/10904750/001734207.pdf",
    checkedAt: "2026-11-05",
  },
  {
    id: "mhlw-ehealthnet-bmi",
    type: "official",
    publisher: "厚生労働省 e-ヘルスネット",
    title: "BMI",
    url: "https://www.e-healthnet.mhlw.go.jp/information/keywords/body-mass-index",
    checkedAt: "2026-11-05",
  },
  {
    id: "mhlw-ehealthnet-energy-sheet",
    type: "official",
    publisher: "厚生労働省 e-ヘルスネット",
    title: "「健康づくりのための身体活動・運動ガイド2023」情報シート：身体活動とエネルギー・栄養素",
    url: "https://kennet.mhlw.go.jp/information/information/exercise/s-00-012.html",
    checkedAt: "2026-11-05",
  },
  {
    id: "mhlw-alcohol-guideline",
    type: "official",
    publisher: "厚生労働省",
    title: "健康に配慮した飲酒に関するガイドラインについて",
    url: "https://www.mhlw.go.jp/stf/newpage_38541.html",
    checkedAt: "2026-11-05",
  },
  {
    id: "memolever-privacy",
    type: "internal",
    publisher: "大手町調査室九課（メモレバ運営）",
    title: "プライバシーポリシー",
    url: "/privacy",
    checkedAt: "2026-11-05",
  },
  {
    id: "memolever-terms",
    type: "internal",
    publisher: "大手町調査室九課（メモレバ運営）",
    title: "利用規約",
    url: "/terms",
    checkedAt: "2026-11-05",
  },
  {
    id: "mext-food-composition-data",
    type: "official",
    publisher: "文部科学省",
    title: "日本食品標準成分表（八訂）増補2023年 第2章 本表データ（Excel）",
    url: "https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html",
    checkedAt: "2026-11-06",
    note: "文部科学省の掲載ページで公開されているExcelデータ（ファイル名の日付は2026年3月27日）の値を使用しています。数値は食品100gあたりです。",
  },
] as const;

export type GuideSource = (typeof GUIDE_SOURCES)[number];
export type GuideSourceId = GuideSource["id"];
export type GuideSourceEntry = GuideSource & { note?: string };

export type GuideArticleSourceRef = {
  id: GuideSourceId;
  note?: string;
};

export function guideSourceById(id: string): GuideSourceEntry | null {
  return GUIDE_SOURCES.find((source) => source.id === id) ?? null;
}

export function guideSourcePublisherLabel(source: { type: GuideSourceType; publisher: string }) {
  return source.type === "internal" ? GUIDE_INTERNAL_SOURCE_LABEL : source.publisher;
}

export function guideSourceFootnote(type: GuideSourceType) {
  return type === "company" ? GUIDE_COMPANY_SOURCE_NOTE : null;
}

export function isExternalGuideSource(source: { type: GuideSourceType }) {
  return source.type !== "internal";
}

export type ResolvedGuideSource = {
  number: number;
  source: GuideSourceEntry;
  note?: string;
};

export function resolveGuideSourceRefs(refs: readonly { id: string; note?: string }[]): ResolvedGuideSource[] {
  return refs.map((ref, index) => {
    const source = guideSourceById(ref.id);
    if (!source) {
      throw new Error(`出典 id「${ref.id}」は台帳にありません。`);
    }
    return { number: index + 1, source, note: ref.note };
  });
}

/** Article の JSON-LD citation。サイト内リンクは含めない。 */
export function externalCitationUrls(refs: readonly { id: string }[]) {
  return resolveGuideSourceRefs(refs)
    .filter((item) => isExternalGuideSource(item.source))
    .map((item) => item.source.url);
}
