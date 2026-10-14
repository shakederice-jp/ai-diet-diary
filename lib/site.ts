/** 公開サイトの共通設定。名前や説明文を変えるときは、このファイルを直す。 */

export const SITE_URL = "https://diet.finance-tower.com";

/** アプリ内の表示名。lib/app-title.ts の APP_TITLE は、この値を使う。 */
export const SITE_NAME = "AIダイエットマネジメント手帳";

export const SITE_TITLE =
  "【無料】AIダイエットマネジメント手帳 ｜AIがカロリーと体重を管理する、新時代の食事記録アプリ";

export const SITE_DESCRIPTION =
  "満腹感を得て無理なく続くダイエット法。食事名からAIがカロリーを自動推定、タニタの体組成計(Health Planet)と連携して体重もグラフ化。ツンデレ猫や関西のおかんなど、5人のAIアドバイザーが親身に寄り添う無料のダイエット記録アプリです。";

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
