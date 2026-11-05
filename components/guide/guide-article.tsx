import { GuideStartButton } from "@/components/guide/guide-actions";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GuideShell, guideCrumbItems } from "@/components/guide/guide-shell";
import { GuideTable } from "@/components/guide/guide-table";
import { InstantLink } from "@/components/instant-link";
import { APP_NAME } from "@/lib/app-title";
import {
  guideArticleBySlug,
  guideArticlePath,
  guideInlinePlainText,
  type GuideArticle,
  type GuideArticleBlock,
  type GuideInline,
} from "@/lib/guide-articles";
import { chapterNeighbors, sameChapterArticles } from "@/lib/guide-catalog";
import { guideChapterBySlug, guideChapterPath } from "@/lib/guide-chapters";
import { GUIDE_PAGES, MEMOLEVER_GUIDE } from "@/lib/guide-links";
import { formatGuideIsoLabel } from "@/lib/guide-meta";
import { externalCitationUrls } from "@/lib/guide-sources";
import { guideArticleStructuredData } from "@/lib/structured-data";

const linkClass =
  "inline-flex min-h-11 items-center text-lg font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

const inlineLinkClass =
  "font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

export function articleDocumentTitle(title: string) {
  return title.endsWith(APP_NAME) ? title : `${title}｜${APP_NAME}`;
}

export function GuideArticleView({ article }: { article: GuideArticle }) {
  const chapter = guideChapterBySlug(article.chapter);
  if (!chapter) {
    throw new Error(article.slug);
  }
  const breadcrumbs = guideCrumbItems(
    { label: chapter.name, href: guideChapterPath(chapter.slug) },
    { label: article.title, href: guideArticlePath(article.slug) },
  );
  const faqs = article.blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: guideInlinePlainText(item.answer),
        }))
      : [],
  );
  const sameTheme = sameChapterArticles(article);
  const neighbors = chapterNeighbors(article);

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
        citations: externalCitationUrls(article.sources),
        faqs,
      })}
    >
      <article className="mt-6">
        <InstantLink
          href={guideChapterPath(chapter.slug)}
          className="inline-flex min-h-8 items-center rounded-full bg-[#FBF6EE] px-3 text-sm font-medium text-[#C65A0A] hover:bg-[#E7DCC8]"
        >
          {chapter.name}
        </InstantLink>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#3A2A22]">{article.title}</h1>
        <p className="mt-3 text-sm text-[#6B4A32]">最終更新日: {formatGuideIsoLabel(article.updatedOn)}</p>
        <div className="mt-5 flex flex-col gap-3">
          {article.lead.map((paragraph, index) => (
            <p key={index} className="text-lg font-medium leading-8 text-zinc-900">
              <GuideText value={paragraph} />
            </p>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {article.blocks.map((block, index) => (
            <ArticleBlock key={`${block.type}-${index}`} block={block} />
          ))}
        </div>
      </article>
      <GuideSourceList sources={article.sources} />
      <nav className="mt-12" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-2xl font-semibold text-[#F27A1A]">
          関連記事
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {article.related.map((slug) => {
            const page = GUIDE_PAGES.find((item) => item.href === slug);
            if (page) {
              return (
                <li key={slug}>
                  <InstantLink href={page.href} className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]">
                    <span className="text-lg font-medium leading-7 text-zinc-950">{page.label}</span>
                  </InstantLink>
                </li>
              );
            }
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
      </nav>
      {sameTheme.length > 0 ? (
        <nav className="mt-12" aria-labelledby="same-theme-heading">
          <h2 id="same-theme-heading" className="text-2xl font-semibold text-[#F27A1A]">
            同じテーマの記事
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {sameTheme.map((item) => (
              <li key={item.slug}>
                <ArticleLinkCard article={item} />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      {neighbors.prev || neighbors.next ? (
        <nav className="mt-12" aria-label="章の中の前後の記事">
          <div className="flex flex-col gap-3">
            {neighbors.prev ? <NeighborLink label="前の記事" article={neighbors.prev} /> : null}
            {neighbors.next ? <NeighborLink label="次の記事" article={neighbors.next} /> : null}
          </div>
        </nav>
      ) : null}
      <InstantLink href={MEMOLEVER_GUIDE.href} className={`mt-4 ${linkClass}`}>
        {MEMOLEVER_GUIDE.label}へ戻る
      </InstantLink>
      <div className="mt-10">
        <GuideStartButton />
      </div>
    </GuideShell>
  );
}

function ArticleLinkCard({ article }: { article: GuideArticle }) {
  return (
    <InstantLink href={guideArticlePath(article.slug)} className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]">
      <span className="text-lg font-medium leading-7 text-zinc-950">{article.title}</span>
      <span className="mt-2 block text-base leading-7 text-zinc-700">{article.description}</span>
    </InstantLink>
  );
}

function NeighborLink({ label, article }: { label: string; article: GuideArticle }) {
  return (
    <InstantLink href={guideArticlePath(article.slug)} className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]">
      <span className="text-sm font-medium text-[#C65A0A]">{label}</span>
      <span className="mt-1 block text-lg font-medium leading-7 text-zinc-950">{article.title}</span>
    </InstantLink>
  );
}

function CiteMarks({ cites }: { cites?: readonly number[] }) {
  if (!cites || cites.length === 0) {
    return null;
  }
  return (
    <>
      {cites.map((number) => (
        <a
          key={number}
          href={`#source-${number}`}
          className="ml-1 text-sm font-medium text-[#C65A0A] underline decoration-[#C65A0A]/40 underline-offset-2"
        >
          [{number}]
        </a>
      ))}
    </>
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
      <>
        <ul className="list-disc space-y-2 pl-5 text-base leading-8 text-zinc-800">
          {block.items.map((item, index) => (
            <li key={index}>
              <GuideText value={item} />
            </li>
          ))}
        </ul>
        <CiteMarks cites={block.cites} />
      </>
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
    return (
      <>
        <GuideTable caption={block.caption} headers={block.headers} rows={block.rows} />
        <CiteMarks cites={block.cites} />
      </>
    );
  }
  if (block.type === "faq") {
    return (
      <div className="flex flex-col gap-6">
        {block.items.map((item) => (
          <section key={item.question}>
            <h3 className="text-lg font-medium text-zinc-950">{item.question}</h3>
            <p className="mt-2 text-base leading-8 text-zinc-800">
              <GuideText value={item.answer} />
            </p>
          </section>
        ))}
        <CiteMarks cites={block.cites} />
      </div>
    );
  }
  return (
    <p className="text-base leading-8 text-zinc-800">
      <GuideText value={block.text} />
      <CiteMarks cites={block.cites} />
    </p>
  );
}

function GuideText({ value }: { value: string | readonly GuideInline[] }) {
  if (typeof value === "string") {
    return value;
  }
  return value.map((part, index) => {
    if (typeof part === "string") {
      return <span key={index}>{part}</span>;
    }
    if ("cite" in part) {
      return (
        <a
          key={`cite-${part.cite}-${index}`}
          href={`#source-${part.cite}`}
          className="text-sm font-medium text-[#C65A0A] underline decoration-[#C65A0A]/40 underline-offset-2"
        >
          [{part.cite}]
        </a>
      );
    }
    return (
      <InstantLink key={`${part.href}-${index}`} href={part.href} className={inlineLinkClass}>
        {part.label}
      </InstantLink>
    );
  });
}
