import { AppBrand } from "@/components/app-brand";
import { GuideLinks } from "@/components/guide-links";
import { InstantLink } from "@/components/instant-link";
import { authSubmitClass } from "@/components/auth-styles";
import { APP_NAME, APP_NAME_EN, APP_SUBTITLE } from "@/lib/app-title";
import {
  APP_DISCLAIMER,
  OPERATOR_NAME,
  SITE_ALTERNATE_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  publicContactEmail,
} from "@/lib/site";

const CATCH = "満腹感を得て無理なく続くダイエット法。";
const SUBLINE = "AIがカロリーと体重を管理する、新時代の無料食事記録アプリ";

const FEATURES = [
  {
    title: "食事名から、カロリーを推定",
    body: "食事名を入力するだけで、AIがカロリーを推定します。自分で数字を入れることもできます。",
  },
  {
    title: "タニタのHealth Planetと連携",
    body: "Health Planetと連携して、体重を自動で取り込めます。",
  },
  {
    title: "カレンダーとグラフ",
    body: "カレンダーとグラフで、体重とカロリーの変化がひと目でわかります。",
  },
  {
    title: "5人のAIアドバイザー",
    body: "ツンデレ猫、10年後のあなた、推し活系(あなたの一番のファン)、昔気質の武士、関西のおかんから、好きな人を選べます。どのキャラクターも、最後はあたたかい一言で締めます。",
  },
  {
    title: "季節に合った自炊メニュー",
    body: "毎日の記録から、AIが季節に合った自炊メニューを提案します。カロリーが低めで、満腹感の得やすい料理です。",
  },
  {
    title: "1週間単位のカロリーの目安",
    body: "カロリーの目安は、1日単位ではなく、1週間単位で調整できるので、無理なく続けられます。",
  },
  {
    title: "連続記録のおやすみ",
    body: "1日だけ記録を休んでも、連続記録を守れるおやすみ機能があります。",
  },
] as const;

const FAQS = [
  {
    question: "無料で使えますか",
    answer: "現在は、無料でご利用いただけます。",
  },
  {
    question: "タニタの体重計と連携できますか",
    answer: "Health Planetと連携できます。連携の方法は、アプリ内のマイページにあります。",
  },
  {
    question: "カロリーはどのように計算されますか",
    answer:
      "食事名からAIが一般的な量を想定して推定した目安です。実際の量や調理法で変わります。手入力で修正もできます。",
  },
  {
    question: "AIアドバイザーは、医療のアドバイスをしてくれますか",
    answer: "いいえ。一般的な情報にもとづくコメントで、医師や管理栄養士による診断・指導ではありません。",
  },
  {
    question: "スマホでも使えますか",
    answer: "はい。ブラウザで使えます。",
  },
  {
    question: "入力したデータは、安全ですか",
    answer:
      "食事や体重などの記録は、ログインした本人だけが見られる仕組みです。自分で作ったシェアカードは、リンクを知っている人が見られます。",
  },
] as const;

const textLinkClass =
  "inline-flex min-h-[52px] w-full items-center text-base font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

function structuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        alternateName: [SITE_ALTERNATE_NAME, APP_NAME_EN],
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        inLanguage: "ja",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "JPY",
        },
        publisher: {
          "@type": "Organization",
          name: OPERATOR_NAME,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

export function LandingPage() {
  const email = publicContactEmail();

  return (
    <div className="box-border flex w-full min-w-0 flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData()).replace(/</g, "\\u003c"),
        }}
      />
      <main className="w-full min-w-0 max-w-2xl break-words rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <AppBrand heading size="hero" />
        <p className="mt-4 text-lg font-medium leading-7 text-balance text-zinc-800">{CATCH}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{SUBLINE}</p>
        <p className="mt-6 text-base leading-7 text-zinc-800">
          {APP_NAME}（{APP_SUBTITLE}）は、食事名を入力するとAIがカロリーを推定し、5人のAIアドバイザーが毎日コメントをくれる、無料のダイエット記録アプリです。
        </p>
        <div className="mt-8 flex flex-col gap-1">
          <InstantLink href="/signup" className={authSubmitClass}>
            無料で始める
          </InstantLink>
          <InstantLink href="/login" className={`${textLinkClass} justify-center`}>
            ログイン
          </InstantLink>
        </div>
        <section className="mt-10" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-lg font-medium text-[#F5821F]">
            特徴
          </h2>
          <div className="mt-6 flex flex-col gap-6">
            {FEATURES.map((feature) => (
              <section key={feature.title}>
                <h3 className="text-base font-medium text-zinc-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{feature.body}</p>
              </section>
            ))}
          </div>
        </section>
        <InstantLink href="/howto" className={`mt-10 ${textLinkClass} justify-start`}>
          使い方を見る
        </InstantLink>
        <GuideLinks className="mt-1" />
        <section className="mt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-lg font-medium text-[#F5821F]">
            よくある質問
          </h2>
          <div className="mt-6 flex flex-col gap-6">
            {FAQS.map((item) => (
              <section key={item.question}>
                <h3 className="text-base font-medium text-zinc-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{item.answer}</p>
              </section>
            ))}
          </div>
        </section>
        <p className="mt-10 text-xs leading-5 text-zinc-500">{APP_DISCLAIMER}</p>
        <footer className="mt-6 border-t border-[#E4D7C6] pt-6">
          <p className="text-sm text-zinc-700">運営: {OPERATOR_NAME}</p>
          {email ? (
            <p className="mt-2 text-sm text-zinc-700">
              お問い合わせ:{" "}
              <a
                href={`mailto:${email}`}
                className="text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
              >
                {email}
              </a>
            </p>
          ) : null}
          <p className="mt-4 text-xs text-zinc-400">{APP_NAME_EN}</p>
        </footer>
      </main>
    </div>
  );
}
