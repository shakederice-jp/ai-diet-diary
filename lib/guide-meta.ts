import type { PageOgImage } from "@/lib/site";

/** ガイドページの最終更新日。表示と JSON-LD と sitemap は、ここだけを見る。 */
export const GUIDE_UPDATED_ON = {
  "/eating-out": "2026-10-30",
  "/sweets": "2026-10-30",
  "/staples": "2026-10-30",
} as const;

export type GuideUpdatedHref = keyof typeof GUIDE_UPDATED_ON;

export function guideUpdatedLabel(href: GuideUpdatedHref) {
  const [year, month, day] = GUIDE_UPDATED_ON[href].split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function guideUpdatedDate(href: GuideUpdatedHref) {
  return new Date(`${GUIDE_UPDATED_ON[href]}T00:00:00.000Z`);
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
