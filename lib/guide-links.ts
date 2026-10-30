/** 案内ページ。ここに足すと、GuideLinks のリンクが増える。 */
export const GUIDE_LINKS = [
  { href: "/eating-out", label: "外食ランチ・定食のカロリー目安" },
] as const;

export type GuideLink = (typeof GUIDE_LINKS)[number];
