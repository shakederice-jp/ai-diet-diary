import { notFound } from "next/navigation";
import { articleDocumentTitle, GuideArticleView } from "@/components/guide/guide-article";
import { GUIDE_ARTICLES, guideArticleBySlug, guideArticlePath } from "@/lib/guide-articles";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = guideArticleBySlug(slug);
  if (!article) {
    return {};
  }
  return pageMetadata({
    title: articleDocumentTitle(article.title),
    description: article.description,
    path: guideArticlePath(article.slug),
    index: true,
    absoluteTitle: true,
  });
}

export default async function GuideArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = guideArticleBySlug(slug);
  if (!article) {
    notFound();
  }
  return <GuideArticleView article={article} />;
}
