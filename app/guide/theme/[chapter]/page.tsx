import { notFound } from "next/navigation";
import { guideChapterDocumentTitle, GuideChapterView } from "@/components/guide/guide-chapter";
import { isGuideChapterPublished } from "@/lib/guide-catalog";
import { GUIDE_CHAPTERS, guideChapterBySlug, guideChapterPath } from "@/lib/guide-chapters";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_CHAPTERS.map((chapter) => ({ chapter: chapter.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: slug } = await params;
  const chapter = guideChapterBySlug(slug);
  if (!chapter) {
    return {};
  }
  return pageMetadata({
    title: guideChapterDocumentTitle(chapter.name),
    description: chapter.description,
    path: guideChapterPath(chapter.slug),
    index: isGuideChapterPublished(chapter.slug),
    absoluteTitle: true,
  });
}

export default async function GuideChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: slug } = await params;
  const chapter = guideChapterBySlug(slug);
  if (!chapter) {
    notFound();
  }
  return <GuideChapterView chapter={chapter} />;
}
