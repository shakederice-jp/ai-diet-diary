import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { MEMOLEVER_GUIDE } from "@/lib/guide-links";

export function guideCrumbItems(...extra: { label: string; href: string }[]): BreadcrumbItem[] {
  return [
    { label: "ホーム", href: "/" },
    { label: MEMOLEVER_GUIDE.label, href: MEMOLEVER_GUIDE.href },
    ...extra,
  ];
}

export function GuideShell({
  breadcrumbs,
  jsonLd,
  children,
}: {
  breadcrumbs: readonly BreadcrumbItem[];
  jsonLd: object;
  children: ReactNode;
}) {
  return (
    <div className="box-border flex w-full min-w-0 flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-8 font-sans sm:px-6 sm:py-10">
      <JsonLd data={jsonLd} />
      <main className="w-full min-w-0 max-w-2xl break-words rounded-3xl bg-[#F3EBDD] p-5 shadow-sm sm:p-8">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#FFB05A] to-[#F27A1A]" aria-hidden="true" />
        <Breadcrumbs items={breadcrumbs} includeJsonLd={false} className="mt-5" />
        {children}
        <SiteFooter className="mt-10" />
      </main>
    </div>
  );
}
