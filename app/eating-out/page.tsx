import { EatingOutGuide } from "@/components/eating-out-guide";
import { EATING_OUT_PAGE_TITLE, eatingOutSummary } from "@/lib/eating-out-guide";
import { GUIDE_OG } from "@/lib/guide-meta";
import { pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = pageMetadata({
  title: EATING_OUT_PAGE_TITLE,
  description: eatingOutSummary(),
  path: "/eating-out",
  index: true,
  absoluteTitle: true,
  image: GUIDE_OG["/eating-out"],
});

export default async function EatingOutPage() {
  const loggedIn = Boolean(await getAuthUserId());
  return <EatingOutGuide startHref={loggedIn ? "/" : "/signup"} />;
}
