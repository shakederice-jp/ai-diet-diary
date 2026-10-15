import { LandingPage } from "@/components/landing-page";
import { pageMetadata, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  index: true,
  absoluteTitle: true,
});

export default function WelcomePage() {
  return <LandingPage />;
}
