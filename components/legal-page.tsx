import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InstantLink } from "@/components/instant-link";
import { APP_NAME } from "@/lib/app-title";
import { LEGAL_PAGES, type LegalHref } from "@/lib/legal";
import { LEGAL_UPDATED_ON, OPERATOR_NAME } from "@/lib/site";

export function LegalPage({
  href,
  children,
}: {
  href: LegalHref;
  children: ReactNode;
}) {
  const page = LEGAL_PAGES.find((item) => item.href === href);
  if (!page) {
    throw new Error(href);
  }
  const others = LEGAL_PAGES.filter((item) => item.href !== href);

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <Breadcrumbs
          items={[
            { label: APP_NAME, href: "/" },
            { label: page.label, href: page.href },
          ]}
        />
        <p className="mt-4 text-xs leading-5 text-zinc-500">制定日・最終更新日: {LEGAL_UPDATED_ON}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{page.label}</h1>
        <div className="mt-8 flex flex-col gap-8">{children}</div>
        <p className="mt-10 text-sm text-zinc-700">運営：{OPERATOR_NAME}</p>
        <nav aria-label="ほかの法務ページ" className="mt-3 flex flex-col">
          {others.map((item) => (
            <InstantLink
              key={item.href}
              href={item.href}
              className="inline-flex min-h-8 items-center text-sm text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
            >
              {item.label}
            </InstantLink>
          ))}
        </nav>
      </main>
    </div>
  );
}

export function LegalSection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-medium text-[#F5821F]">
        {number}. {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-800">{children}</div>
    </section>
  );
}
