import { SweetsGuide } from "@/components/sweets-guide";
import { SWEETS_DESCRIPTION, SWEETS_PAGE_TITLE } from "@/lib/sweets-guide";
import { pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = pageMetadata({
  title: SWEETS_PAGE_TITLE,
  description: SWEETS_DESCRIPTION,
  path: "/sweets",
  index: true,
  absoluteTitle: true,
});

export default async function SweetsPage() {
  const loggedIn = Boolean(await getAuthUserId());
  return <SweetsGuide startHref={loggedIn ? "/" : "/signup"} />;
}
