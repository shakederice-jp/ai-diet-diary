import type { MetadataRoute } from "next";
import { GUIDE_ARTICLES } from "@/lib/guide-articles";
import { guideChapterLastModified, publishedGuideChapters } from "@/lib/guide-catalog";
import { guideChapterPath } from "@/lib/guide-chapters";
import { GUIDE_PATH } from "@/lib/guide-lp";
import { guideIsoDate, guideUpdatedDate, MEMOLEVER_GUIDE_UPDATED_ON } from "@/lib/guide-meta";
import { legalUpdatedDate, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const legalDate = legalUpdatedDate();
  const guideDate = guideIsoDate(MEMOLEVER_GUIDE_UPDATED_ON);
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/howto` },
    { url: `${SITE_URL}/eating-out`, lastModified: guideUpdatedDate("/eating-out") },
    { url: `${SITE_URL}/sweets`, lastModified: guideUpdatedDate("/sweets") },
    { url: `${SITE_URL}/staples`, lastModified: guideUpdatedDate("/staples") },
    { url: `${SITE_URL}${GUIDE_PATH}`, lastModified: guideDate },
    ...publishedGuideChapters().map((chapter) => ({
      url: `${SITE_URL}${guideChapterPath(chapter.slug)}`,
      lastModified: guideIsoDate(guideChapterLastModified(chapter.slug)),
    })),
    ...GUIDE_ARTICLES.map((article) => ({
      url: `${SITE_URL}/guide/${article.slug}`,
      lastModified: guideIsoDate(article.updatedOn),
    })),
    { url: `${SITE_URL}/privacy`, lastModified: legalDate },
    { url: `${SITE_URL}/terms`, lastModified: legalDate },
    { url: `${SITE_URL}/tokushoho`, lastModified: legalDate },
  ];
}
