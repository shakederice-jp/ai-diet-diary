/** 公開ガイド。ラベルはここだけに書き、パンくずとリンクはここから引く。 */

const HOWTO_PAGE = { href: "/howto", label: "使い方" } as const;
const EATING_OUT_PAGE = { href: "/eating-out", label: "外食ランチ・定食のカロリー目安" } as const;
const SWEETS_PAGE = { href: "/sweets", label: "お菓子・スイーツのカロリー目安" } as const;
const STAPLES_PAGE = { href: "/staples", label: "ご飯・パン・麺のカロリー早見表" } as const;

/** パンくずとフッターに出す公開ページ。 */
export const GUIDE_PAGES = [HOWTO_PAGE, EATING_OUT_PAGE, SWEETS_PAGE, STAPLES_PAGE] as const;

export type GuidePage = (typeof GUIDE_PAGES)[number];

/** カレンダーや日付画面などに並べるカロリーガイド。使い方は含めない。 */
export const GUIDE_LINKS = [EATING_OUT_PAGE, SWEETS_PAGE, STAPLES_PAGE] as const;

export type GuideLink = (typeof GUIDE_LINKS)[number];

export function guidePageByHref(href: GuidePage["href"]) {
  const page = GUIDE_PAGES.find((item) => item.href === href);
  if (!page) {
    throw new Error(`不明なガイド: ${href}`);
  }
  return page;
}
