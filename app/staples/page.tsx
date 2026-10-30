import { Breadcrumbs, guideBreadcrumbItems } from "@/components/Breadcrumbs";
import { GuideAbout } from "@/components/guide-about";
import { OtherGuides } from "@/components/guide-links";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { StaplesTables } from "@/components/staples-guide";
import { TryAppCta } from "@/components/try-app-cta";
import { GUIDE_OG, GUIDE_UPDATED_ON } from "@/lib/guide-meta";
import {
  STAPLES_DESCRIPTION,
  STAPLES_PAGE_HEADING,
  STAPLES_PAGE_TITLE,
  STAPLES_SUMMARY,
} from "@/lib/staples-guide";
import { guideStructuredData } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = pageMetadata({
  title: STAPLES_PAGE_TITLE,
  description: STAPLES_DESCRIPTION,
  path: "/staples",
  index: true,
  absoluteTitle: true,
  image: GUIDE_OG["/staples"],
});

export default async function StaplesPage() {
  const loggedIn = Boolean(await getAuthUserId());
  const breadcrumbs = guideBreadcrumbItems("/staples");

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-3xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <JsonLd
          data={guideStructuredData({
            name: STAPLES_PAGE_HEADING,
            description: STAPLES_SUMMARY,
            path: "/staples",
            dateModified: GUIDE_UPDATED_ON["/staples"],
            breadcrumbs,
          })}
        />
        <Breadcrumbs items={breadcrumbs} includeJsonLd={false} />
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{STAPLES_PAGE_HEADING}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-700">{STAPLES_SUMMARY}</p>
        <div className="mt-6">
          <StaplesTables />
        </div>
        <OtherGuides currentHref="/staples" className="mt-8" />
        <TryAppCta href={loggedIn ? "/" : "/signup"} className="mt-4" />
        <GuideAbout href="/staples" />
        <SiteFooter className="mt-6" />
      </main>
    </div>
  );
}
