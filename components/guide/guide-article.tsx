import { GuideStartButton } from "@/components/guide/guide-actions";
import { GuideShell, guideCrumbItems } from "@/components/guide/guide-shell";
import { GuideTable } from "@/components/guide/guide-table";
import { InstantLink } from "@/components/instant-link";
import { APP_NAME } from "@/lib/app-title";
import {
  guideArticleBySlug,
  guideArticlePath,
  type GuideArticle,
  type GuideArticleBlock,
  type GuideInline,
} from "@/lib/guide-articles";
import { MEMOLEVER_GUIDE } from "@/lib/guide-links";
import { formatGuideIsoLabel } from "@/lib/guide-meta";
import { guideArticleStructuredData } from "@/lib/structured-data";

const linkClass =
  "inline-flex min-h-11 items-center text-lg font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

const inlineLinkClass =
  "font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

export function articleDocumentTitle(title: string) {
  return title.endsWith(APP_NAME) ? title : `${title}｜${APP_NAME}`;
}

export function GuideArticleView({ article }: { article: GuideArticle }) {
  const breadcrumbs = guideCrumbItems({
    label: article.title,
    href: guideArticlePath(article.slug),
  });
  const faqs = article.blocks.flatMap((block) => (block.type === "faq" ? block.items : []));

  return (
    <GuideShell
      breadcrumbs={breadcrumbs}
      jsonLd={guideArticleStructuredData({
        headline: article.title,
        description: article.description,
        path: guideArticlePath(article.slug),
        datePublished: article.updatedOn,
        dateModified: article.updatedOn,
        breadcrumbs,
        faqs,
      })}
    >
      <article className="mt-6">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#3A2A22]">{article.title}</h1>
        <p className="mt-3 text-sm text-[#6B4A32]">最終更新日: {formatGuideIsoLabel(article.updatedOn)}</p>
        <div className="mt-5 flex flex-col gap-3">
          {article.lead.map((paragraph) => (
            <p key={paragraph} className="text-lg font-medium leading-8 text-zinc-900">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {article.blocks.map((block, index) => (
            <ArticleBlock key={`${block.type}-${index}`} block={block} />
          ))}
        </div>
      </article>
      <nav className="mt-12" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-2xl font-semibold text-[#F27A1A]">
          関連記事
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {article.related.map((slug) => {
            const related = guideArticleBySlug(slug);
            if (!related) {
              return null;
            }
            return (
              <li key={slug}>
                <InstantLink href={guideArticlePath(slug)} className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]">
                  <span className="text-lg font-medium leading-7 text-zinc-950">{related.title}</span>
                  <span className="mt-2 block text-base leading-7 text-zinc-700">{related.description}</span>
                </InstantLink>
              </li>
            );
          })}
        </ul>
        <InstantLink href={MEMOLEVER_GUIDE.href} className={`mt-4 ${linkClass}`}>
          {MEMOLEVER_GUIDE.label}へ戻る
        </InstantLink>
      </nav>
      <div className="mt-10">
        <GuideStartButton />
      </div>
    </GuideShell>
  );
}

function ArticleBlock({ block }: { block: GuideArticleBlock }) {
  if (block.type === "h2") {
    return <h2 className="mt-8 text-xl font-semibold text-[#F27A1A]">{block.text}</h2>;
  }
  if (block.type === "h3") {
    return <h3 className="mt-6 text-lg font-medium text-zinc-950">{block.text}</h3>;
  }
  if (block.type === "ul") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-base leading-8 text-zinc-800">
        {block.items.map((item, index) => (
          <li key={index}>
            <GuideText value={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "links") {
    return (
      <ul className="mt-2 flex flex-col">
        {block.items.map((item) => (
          <li key={item.href}>
            <InstantLink href={item.href} className={linkClass}>
              {item.label}
            </InstantLink>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "table") {
    return <GuideTable caption={block.caption} headers={block.headers} rows={block.rows} />;
  }
  if (block.type === "faq") {
    return (
      <div className="flex flex-col gap-6">
        {block.items.map((item) => (
          <section key={item.question}>
            <h3 className="text-lg font-medium text-zinc-950">{item.question}</h3>
            <p className="mt-2 text-base leading-8 text-zinc-800">{item.answer}</p>
          </section>
        ))}
      </div>
    );
  }
  return (
    <p className="text-base leading-8 text-zinc-800">
      <GuideText value={block.text} />
    </p>
  );
}

function GuideText({ value }: { value: string | readonly GuideInline[] }) {
  if (typeof value === "string") {
    return value;
  }
  return value.map((part, index) =>
    typeof part === "string" ? (
      <span key={index}>{part}</span>
    ) : (
      <InstantLink key={`${part.href}-${index}`} href={part.href} className={inlineLinkClass}>
        {part.label}
      </InstantLink>
    ),
  );
}
