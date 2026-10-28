import type { Metadata } from "next";
import { APP_NAME, APP_CATCHCOPY, APP_SUBTITLE } from "@/lib/app-title";

/** 公開サイトの共通設定。名前は lib/app-title.ts。説明文を変えるときは、このファイルを直す。 */

export { APP_NAME, APP_NAME_EN, APP_CATCHCOPY, APP_SUBTITLE } from "@/lib/app-title";

export const SITE_URL = "https://diet.finance-tower.com";

/** アプリ内の表示名。値は APP_NAME。 */
export const SITE_NAME = APP_NAME;

/** 検索用の副題。値は APP_SUBTITLE。 */
export const SITE_ALTERNATE_NAME = APP_SUBTITLE;

export const SITE_TITLE =
  `【無料】${APP_NAME} ｜${APP_SUBTITLE} - AIがカロリーと体重を管理する食事記録アプリ`;

export const SITE_DESCRIPTION =
  `${APP_NAME}は、${APP_SUBTITLE}です。満腹感を得て無理なく続くダイエット法。食事名からAIがカロリーを自動推定、タニタの体組成計(Health Planet)と連携して体重もグラフ化。ツンデレ猫や関西のおかんなど、5人のAIアドバイザーが親身に寄り添う無料のダイエット記録アプリです。`;

/** 紹介ページのフッター上と、使い方の最後に出す共通の免責。 */
export const APP_DISCLAIMER =
  "効果や結果には個人差があります。食事・運動の目安は一般的な情報で、医療上の助言ではありません。";

export const OPERATOR_NAME = "ピークアンドバレー合同会社";

/** 空のときは、お問い合わせを出さない。 */
export const CONTACT_EMAIL = "";

/** 空、またはメールアドレスの形でないときは null。 */
export function publicContactEmail() {
  const email = CONTACT_EMAIL.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

export const OG_IMAGE_PATH = "/og.png";

export const OG_IMAGE = {
  url: OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: `${APP_CATCHCOPY}　${APP_NAME}`,
} as const;

/** 各ページの title、説明、canonical、OGP。title の書式は layout の template と揃える。英語表記は入れない。 */
export function pageMetadata(input: {
  title: string;
  description?: string;
  path: string;
  index: boolean;
  absoluteTitle?: boolean;
}): Metadata {
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const description = input.description ?? SITE_DESCRIPTION;
  const ogTitle = input.absoluteTitle ? input.title : `${input.title} | ${SITE_NAME}`;
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: { canonical: path },
    robots: { index: input.index, follow: true },
    openGraph: {
      title: ogTitle,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      locale: "ja_JP",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
