import type { MetadataRoute } from "next";
import { guideUpdatedDate } from "@/lib/guide-meta";
import { legalUpdatedDate, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const legalDate = legalUpdatedDate();
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/howto` },
    { url: `${SITE_URL}/eating-out`, lastModified: guideUpdatedDate("/eating-out") },
    { url: `${SITE_URL}/sweets`, lastModified: guideUpdatedDate("/sweets") },
    { url: `${SITE_URL}/staples`, lastModified: guideUpdatedDate("/staples") },
    { url: `${SITE_URL}/privacy`, lastModified: legalDate },
    { url: `${SITE_URL}/terms`, lastModified: legalDate },
    { url: `${SITE_URL}/tokushoho`, lastModified: legalDate },
  ];
}
