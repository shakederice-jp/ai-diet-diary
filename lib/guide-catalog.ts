import { GUIDE_ARTICLES, guideArticlePath, type GuideArticle } from "@/lib/guide-articles";
import {
  GUIDE_CHAPTER_PUBLISH_MIN,
  orderedGuideChapters,
  type GuideChapterSlug,
} from "@/lib/guide-chapters";
import { GUIDE_RESOURCE_LINKS } from "@/lib/guide-lp";
import { guidePageByHref } from "@/lib/guide-links";
import { GUIDE_UPDATED_ON } from "@/lib/guide-meta";
import type { GuideSearchDoc } from "@/lib/guide-search";

export type GuideChapterEntry = {
  href: string;
  title: string;
  summary: string;
  updatedOn: string;
};

function calorieGuideEntries(): GuideChapterEntry[] {
  return GUIDE_RESOURCE_LINKS.map((item) => {
    const page = guidePageByHref(item.href);
    return {
      href: page.href,
      title: page.label,
      summary: item.blurb,
      updatedOn: GUIDE_UPDATED_ON[item.href],
    };
  });
}

export function orderedChapterArticles(slug: GuideChapterSlug) {
  return GUIDE_ARTICLES.map((article, index) => ({ article, index }))
    .filter((item) => item.article.chapter === slug)
    .sort((a, b) => {
      const ao = a.article.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.article.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) {
        return ao - bo;
      }
      return a.index - b.index;
    })
    .map((item) => item.article);
}

export function guideChapterEntries(slug: GuideChapterSlug): GuideChapterEntry[] {
  const articles = orderedChapterArticles(slug).map((article) => ({
    href: guideArticlePath(article.slug),
    title: article.title,
    summary: article.description,
    updatedOn: article.updatedOn,
  }));
  if (slug === "calorie-guides") {
    return [...calorieGuideEntries(), ...articles];
  }
  return articles;
}

export function isGuideChapterPublished(slug: GuideChapterSlug) {
  return guideChapterEntries(slug).length >= GUIDE_CHAPTER_PUBLISH_MIN;
}

export function publishedGuideChapters() {
  return orderedGuideChapters().filter((chapter) => isGuideChapterPublished(chapter.slug));
}

export function guideChapterLastModified(slug: GuideChapterSlug) {
  const dates = guideChapterEntries(slug).map((entry) => entry.updatedOn);
  return dates.sort()[dates.length - 1] ?? "2026-11-02";
}

export function newestGuideArticles(limit = 5) {
  return GUIDE_ARTICLES.map((article, index) => ({ article, index }))
    .sort((a, b) => {
      if (a.article.updatedOn !== b.article.updatedOn) {
        return a.article.updatedOn < b.article.updatedOn ? 1 : -1;
      }
      return a.index - b.index;
    })
    .slice(0, limit)
    .map((item) => item.article);
}

export function sameChapterArticles(article: GuideArticle, limit = 5) {
  return orderedChapterArticles(article.chapter)
    .filter((item) => item.slug !== article.slug)
    .slice(0, limit);
}

export function chapterNeighbors(article: GuideArticle) {
  const list = orderedChapterArticles(article.chapter);
  const index = list.findIndex((item) => item.slug === article.slug);
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}

export function guideSearchDocs(): GuideSearchDoc[] {
  return GUIDE_ARTICLES.map((article) => ({
    href: guideArticlePath(article.slug),
    title: article.title,
    summary: article.description,
    keywords: article.keywords ?? [],
  }));
}
