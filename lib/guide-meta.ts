import type { GuideSourceId } from "@/lib/guide-sources";
import type { PageOgImage } from "@/lib/site";

/** ガイドページの最終更新日。表示と JSON-LD と sitemap は、ここだけを見る。 */
export const GUIDE_UPDATED_ON = {
  "/eating-out": "2026-11-07",
  "/sweets": "2026-11-07",
  "/staples": "2026-11-07",
} as const;

/** 目安ページに出す出典。JSON-LD の citation もここを見る。 */
export const GUIDE_PAGE_SOURCE_IDS = {
  "/eating-out": ["mext-fooddb"],
  "/sweets": ["mext-fooddb", "maff-balance-guide-usage"],
  "/staples": ["mext-fooddb"],
} as const satisfies Record<GuideUpdatedHref, readonly GuideSourceId[]>;

/** メモレバ ガイド（/guide と記事）の最終更新日。表示、JSON-LD、sitemap はここを見る。 */
export const MEMOLEVER_GUIDE_UPDATED_ON = "2026-11-02";

export type GuideUpdatedHref = keyof typeof GUIDE_UPDATED_ON;

export function formatGuideIsoLabel(iso: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!matched) {
    throw new Error("guide date");
  }
  return `${matched[1]}年${Number(matched[2])}月${Number(matched[3])}日`;
}

export function guideIsoDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error("guide date");
  }
  return new Date(`${iso}T00:00:00.000Z`);
}

export function guideUpdatedLabel(href: GuideUpdatedHref) {
  return formatGuideIsoLabel(GUIDE_UPDATED_ON[href]);
}

export function guideUpdatedDate(href: GuideUpdatedHref) {
  return guideIsoDate(GUIDE_UPDATED_ON[href]);
}

export const GUIDE_OG: Record<GuideUpdatedHref, PageOgImage> = {
  "/eating-out": {
    url: "/og/eating-out.png",
    width: 1200,
    height: 630,
    alt: "外食ランチ・定食のカロリー目安",
  },
  "/sweets": {
    url: "/og/sweets.png",
    width: 1200,
    height: 630,
    alt: "お菓子・スイーツのカロリー目安",
  },
  "/staples": {
    url: "/og/staples.png",
    width: 1200,
    height: 630,
    alt: "ご飯・パン・麺のカロリー早見表",
  },
};
