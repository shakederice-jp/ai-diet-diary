import { GuideSample } from "@/components/guide/sample-screens";
import { GuideHowtoButton, GuideStartButton } from "@/components/guide/guide-actions";
import { GuideShell, guideCrumbItems } from "@/components/guide/guide-shell";
import { LegalContact } from "@/components/legal-contact";
import { InstantLink } from "@/components/instant-link";
import { APP_CATCHCOPY, APP_NAME, APP_SUBTITLE } from "@/lib/app-title";
import { GUIDE_ARTICLES, guideArticlePath } from "@/lib/guide-articles";
import { guidePageByHref } from "@/lib/guide-links";
import { formatGuideIsoLabel } from "@/lib/guide-meta";
import {
  GUIDE_ABOUT_MORE,
  GUIDE_AUDIENCE,
  GUIDE_CAUTION,
  GUIDE_COMPARE_COLUMNS,
  GUIDE_COMPARE_INTRO,
  GUIDE_COMPARE_ROWS,
  GUIDE_DEFINITION,
  GUIDE_DESCRIPTION,
  GUIDE_FAQS,
  GUIDE_FEATURES,
  GUIDE_RESOURCE_LINKS,
  GUIDE_STEPS,
  GUIDE_TITLE,
  GUIDE_UPDATED_ON,
  GUIDE_WEEKLY,
} from "@/lib/guide-lp";
import { memoleverGuideStructuredData } from "@/lib/structured-data";
import { OPERATOR_NAME } from "@/lib/site";

const linkClass =
  "font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

export function GuideLanding() {
  const breadcrumbs = guideCrumbItems();
  const updated = formatGuideIsoLabel(GUIDE_UPDATED_ON);

  return (
    <GuideShell
      breadcrumbs={breadcrumbs}
      jsonLd={memoleverGuideStructuredData({
        name: GUIDE_TITLE,
        description: GUIDE_DESCRIPTION,
        dateModified: GUIDE_UPDATED_ON,
        breadcrumbs,
        faqs: GUIDE_FAQS,
      })}
    >
      <header className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight text-[#3A2A22]">{APP_NAME}</h1>
        <p className="mt-2 text-lg leading-7 text-[#6B4A32]">{APP_SUBTITLE}</p>
        <p className="mt-3 text-xl font-medium leading-8 text-zinc-900">{APP_CATCHCOPY}</p>
        <p className="mt-3 text-sm text-[#6B4A32]">最終更新日: {updated}</p>
      </header>
      <div className="mt-6 flex flex-col gap-3">
        <GuideStartButton />
        <GuideHowtoButton />
      </div>

      <section className="mt-12" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-2xl font-semibold text-[#F27A1A]">
          {APP_NAME}とは
        </h2>
        <p className="mt-4 text-lg font-medium leading-8 text-zinc-900">{GUIDE_DEFINITION}</p>
        <div className="mt-4 flex flex-col gap-3">
          {GUIDE_ABOUT_MORE.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-zinc-800">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="audience-heading">
        <h2 id="audience-heading" className="text-2xl font-semibold text-[#F27A1A]">
          こんな方に
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {GUIDE_AUDIENCE.map((item) => (
            <li key={item.title} className="rounded-2xl bg-[#FBF6EE] p-4">
              <h3 className="text-lg font-medium text-zinc-950">{item.title}</h3>
              <p className="mt-2 text-base leading-8 text-zinc-800">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl font-semibold text-[#F27A1A]">
          7つの特徴
        </h2>
        <div className="mt-6 flex flex-col gap-10">
          {GUIDE_FEATURES.map((feature, index) => (
            <section key={feature.id} aria-labelledby={`feature-${feature.id}`}>
              <h3 id={`feature-${feature.id}`} className="text-xl font-medium text-zinc-950">
                {index + 1}. {feature.title}
              </h3>
              <p className="mt-3 text-base leading-8 text-zinc-800">{feature.body}</p>
              <GuideSample id={feature.id} />
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="text-2xl font-semibold text-[#F27A1A]">
          使い方は3ステップ
        </h2>
        <ol className="mt-4 flex flex-col gap-4">
          {GUIDE_STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl bg-[#FBF6EE] p-4">
              <h3 className="text-lg font-medium text-zinc-950">
                {index + 1}. {step.title}
              </h3>
              <p className="mt-2 text-base leading-8 text-zinc-800">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="weekly-heading">
        <h2 id="weekly-heading" className="text-2xl font-semibold text-[#F27A1A]">
          週の上限という考え方
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {GUIDE_WEEKLY.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-zinc-800">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="resources-heading">
        <h2 id="resources-heading" className="text-2xl font-semibold text-[#F27A1A]">
          無料で使える目安ガイド
        </h2>
        <p className="mt-4 text-base leading-8 text-zinc-800">
          外食、お菓子、主食のカロリー目安は、ログインしなくても読めます。数値は目安です。
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {GUIDE_RESOURCE_LINKS.map((item) => {
            const page = guidePageByHref(item.href);
            return (
              <li key={item.href}>
                <InstantLink href={page.href} className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]">
                  <span className={`text-lg ${linkClass}`}>{page.label}</span>
                  <span className="mt-2 block text-base leading-7 text-zinc-800">{item.blurb}</span>
                </InstantLink>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="text-2xl font-semibold text-[#F27A1A]">
          {APP_NAME}の位置づけ
        </h2>
        <p className="mt-4 text-base leading-8 text-zinc-800">{GUIDE_COMPARE_INTRO}</p>
        <div className="mt-4 flex flex-col gap-4">
          {GUIDE_COMPARE_ROWS.map((row) => (
            <section key={row.topic} className="rounded-2xl bg-[#FBF6EE] p-4" aria-labelledby={`compare-${row.topic}`}>
              <h3 id={`compare-${row.topic}`} className="text-lg font-medium text-zinc-950">
                {row.topic}
              </h3>
              <dl className="mt-3 flex flex-col gap-3">
                {GUIDE_COMPARE_COLUMNS.map((column, index) => (
                  <div key={column}>
                    <dt className="text-sm font-medium text-[#C65A0A]">{column}</dt>
                    <dd className="mt-1 text-base leading-7 text-zinc-800">{row.cells[index]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="articles-heading">
        <h2 id="articles-heading" className="text-2xl font-semibold text-[#F27A1A]">
          記事一覧
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {GUIDE_ARTICLES.map((article) => (
            <li key={article.slug}>
              <InstantLink
                href={guideArticlePath(article.slug)}
                className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]"
              >
                <span className="text-lg font-medium leading-7 text-zinc-950">{article.title}</span>
                <span className="mt-2 block text-base leading-7 text-zinc-700">{article.description}</span>
              </InstantLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold text-[#F27A1A]">
          よくある質問
        </h2>
        <div className="mt-4 flex flex-col gap-6">
          {GUIDE_FAQS.map((item) => (
            <section key={item.question}>
              <h3 className="text-lg font-medium text-zinc-950">{item.question}</h3>
              <p className="mt-2 text-base leading-8 text-zinc-800">{item.answer}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="operator-heading">
        <h2 id="operator-heading" className="text-2xl font-semibold text-[#F27A1A]">
          運営者情報
        </h2>
        <p className="mt-4 text-base leading-8 text-zinc-800">運営: {OPERATOR_NAME}</p>
        <p className="text-base leading-8 text-zinc-800">最終更新日: {updated}</p>
        <LegalContact />
        <p className="mt-4 text-base leading-8 text-zinc-800">{GUIDE_CAUTION}</p>
      </section>

      <div className="mt-12">
        <GuideStartButton />
      </div>
    </GuideShell>
  );
}
