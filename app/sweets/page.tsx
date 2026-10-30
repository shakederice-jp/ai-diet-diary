import { SweetsGuide } from "@/components/sweets-guide";
import { SWEETS_DESCRIPTION, SWEETS_PAGE_TITLE } from "@/lib/sweets-guide";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: SWEETS_PAGE_TITLE,
  description: SWEETS_DESCRIPTION,
  path: "/sweets",
  index: true,
  absoluteTitle: true,
});

export default function SweetsPage() {
  return <SweetsGuide />;
}
