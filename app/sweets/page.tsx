import { SweetsGuide } from "@/components/sweets-guide";
import { sweetsPageDescription, sweetsPageTitle } from "@/lib/sweets-guide";
import { GUIDE_OG } from "@/lib/guide-meta";
import { pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = pageMetadata({
  title: sweetsPageTitle(),
  description: sweetsPageDescription(),
  path: "/sweets",
  index: true,
  absoluteTitle: true,
  image: GUIDE_OG["/sweets"],
});

export default async function SweetsPage() {
  const loggedIn = Boolean(await getAuthUserId());
  return <SweetsGuide startHref={loggedIn ? "/" : "/signup"} />;
}
