import { EatingOutGuide } from "@/components/eating-out-guide";
import { EATING_OUT_LEAD, EATING_OUT_TITLE } from "@/lib/eating-out-guide";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: EATING_OUT_TITLE,
  description: EATING_OUT_LEAD,
  path: "/eating-out",
  index: true,
});

export default function EatingOutPage() {
  return <EatingOutGuide />;
}
