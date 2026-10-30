export const LEGAL_PAGES = [
  {
    href: "/privacy",
    label: "プライバシーポリシー",
    title: "プライバシーポリシー｜メモレバ",
    description: "メモレバが取得する情報、利用目的、外部サービスへの委託、Cookie、開示と削除の請求について。",
  },
  {
    href: "/terms",
    label: "利用規約",
    title: "利用規約｜メモレバ",
    description: "メモレバの利用条件、禁止事項、健康情報とAIの注意、免責、準拠法について。",
  },
  {
    href: "/tokushoho",
    label: "特定商取引法に基づく表記",
    title: "特定商取引法に基づく表記｜メモレバ",
    description: "メモレバの運営者、お問い合わせ、販売価格についての表記です。現在、有料の販売は行っていません。",
  },
] as const;

export type LegalHref = (typeof LEGAL_PAGES)[number]["href"];
