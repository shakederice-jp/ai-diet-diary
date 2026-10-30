import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/howto` },
    { url: `${SITE_URL}/eating-out` },
    { url: `${SITE_URL}/sweets` },
  ];
}
