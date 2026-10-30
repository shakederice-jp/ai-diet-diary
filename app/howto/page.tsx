import { AppBrand } from "@/components/app-brand";
import { Breadcrumbs, guideBreadcrumbItems } from "@/components/Breadcrumbs";
import { OtherGuides } from "@/components/guide-links";
import { InstantLink } from "@/components/instant-link";
import { TryAppCta } from "@/components/try-app-cta";
import {
  HOWTO_APPENDIX,
  HOWTO_BACK_TO_LOGIN,
  HOWTO_BACK_TO_MYPAGE,
  HOWTO_DESCRIPTION,
  HOWTO_LEAD,
  HOWTO_SECTIONS,
  HOWTO_TITLE,
} from "@/lib/howto";
import { guidePageByHref } from "@/lib/guide-links";
import { APP_DISCLAIMER, pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = pageMetadata({
  title: HOWTO_TITLE,
  description: HOWTO_DESCRIPTION,
  path: "/howto",
  index: true,
});

export default async function HowToPage() {
  const loggedIn = Boolean(await getAuthUserId());
  const eatingOut = guidePageByHref("/eating-out");
  const sweets = guidePageByHref("/sweets");

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <AppBrand size="label" />
        <Breadcrumbs items={guideBreadcrumbItems("/howto")} className="mt-4" />
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{HOWTO_TITLE}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{HOWTO_LEAD}</p>
        <div className="mt-8 flex flex-col gap-8">
          {HOWTO_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-medium text-[#F5821F]">{section.heading}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-800">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {section.heading === "食事の記録のしかた" ? (
                <p className="mt-3 text-sm leading-6 text-zinc-800">
                  外食や間食の目安は、
                  <InstantLink
                    href={eatingOut.href}
                    className="mx-1 inline-flex min-h-8 items-center text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
                  >
                    {eatingOut.label}
                  </InstantLink>
                  と
                  <InstantLink
                    href={sweets.href}
                    className="mx-1 inline-flex min-h-8 items-center text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
                  >
                    {sweets.label}
                  </InstantLink>
                  にまとめています。
                </p>
              ) : null}
            </section>
          ))}
        </div>
        <InstantLink
          href={loggedIn ? "/mypage" : "/login"}
          className="mt-10 flex min-h-[52px] items-center text-sm font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
        >
          {loggedIn ? HOWTO_BACK_TO_MYPAGE : HOWTO_BACK_TO_LOGIN}
        </InstantLink>
        <div id="howto-appendix">
          {HOWTO_APPENDIX ? (
            <section className="mt-10" aria-label={HOWTO_APPENDIX.heading}>
              <h2 className="text-base font-medium text-[#F5821F]">{HOWTO_APPENDIX.heading}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-800">
                {HOWTO_APPENDIX.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <OtherGuides currentHref="/howto" className="mt-10" />
        <TryAppCta href={loggedIn ? "/" : "/signup"} className="mt-4" />
        <p className="mt-10 text-xs leading-5 text-zinc-500">{APP_DISCLAIMER}</p>
      </main>
    </div>
  );
}
