export const LEGAL_PAGES = [
  {
    href: "/privacy",
    label: "プライバシーポリシー",
    title: "プライバシーポリシー｜メモレバ",
    description:
      "体重や食事などの記録を含め、メモレバが取得する情報、利用目的、AI機能、外部サービスへの委託、Cookie、保管と削除、開示・訂正・利用停止の請求について説明します。",
  },
  {
    href: "/terms",
    label: "利用規約",
    title: "利用規約｜メモレバ",
    description:
      "メモレバの利用登録、アカウントの管理、禁止事項、健康情報とAIの注意、料金、外部サービスとの連携、免責、準拠法と管轄について説明します。",
  },
  {
    href: "/tokushoho",
    label: "特定商取引法に基づく表記",
    title: "特定商取引法に基づく表記｜メモレバ",
    description:
      "メモレバの販売事業者、運営統括責任者、所在地、電話番号、メールアドレス、販売URLの表記です。現在、有料の商品・サービスの販売は行っていません。",
  },
] as const;

export type LegalHref = (typeof LEGAL_PAGES)[number]["href"];
