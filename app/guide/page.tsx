import { GuideLanding } from "@/components/guide/guide-landing";
import { GUIDE_DESCRIPTION, GUIDE_PATH, GUIDE_TITLE } from "@/lib/guide-lp";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: GUIDE_TITLE,
  description: GUIDE_DESCRIPTION,
  path: GUIDE_PATH,
  index: true,
  absoluteTitle: true,
});

export default function GuidePage() {
  return <GuideLanding />;
}
