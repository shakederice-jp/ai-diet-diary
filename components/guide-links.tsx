"use client";

import { InstantLink } from "@/components/instant-link";
import { GUIDE_LINKS, GUIDE_PAGES, guidePageByHref, type GuideLink, type GuidePage } from "@/lib/guide-links";

const linkClass =
  "inline-flex min-h-11 items-center gap-1 text-sm text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

export function GuideLinks({
  className = "",
  newTab = false,
  labelFor,
}: {
  className?: string;
  newTab?: boolean;
  labelFor?: (link: GuideLink) => string;
}) {
  return (
    <nav aria-label="案内" className={`flex flex-wrap items-center gap-x-3 ${className}`}>
      {GUIDE_LINKS.map((link) => (
        <InstantLink
          key={link.href}
          href={link.href}
          className={linkClass}
          {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <span>{labelFor ? labelFor(link) : link.label}</span>
          <span aria-hidden="true">→</span>
        </InstantLink>
      ))}
    </nav>
  );
}

const quietLinkClass =
  "inline-flex min-h-8 items-center text-sm text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

export function OtherGuides({
  currentHref,
  className = "",
}: {
  currentHref: GuidePage["href"];
  className?: string;
}) {
  const links = GUIDE_PAGES.filter((page) => page.href !== currentHref);
  return (
    <section className={className} aria-labelledby={`other-guides-${currentHref.slice(1)}`}>
      <h2 id={`other-guides-${currentHref.slice(1)}`} className="text-sm font-medium text-[#6B4A32]">
        ほかのガイド
      </h2>
      <nav className="mt-1 flex flex-col">
        {links.map((link) => (
          <InstantLink key={link.href} href={link.href} className={quietLinkClass}>
            {link.label} →
          </InstantLink>
        ))}
      </nav>
    </section>
  );
}

const GUIDE_SENTENCE = {
  "/eating-out": "ランチ・外食のカロリーは",
  "/sweets": "間食・おやつのカロリーは",
} as const;

export function GuideSentence({
  href,
  className = "",
}: {
  href: keyof typeof GUIDE_SENTENCE;
  className?: string;
}) {
  const page = guidePageByHref(href);
  return (
    <p className={`text-[13px] leading-5 text-[#6B4A32] ${className}`}>
      {GUIDE_SENTENCE[href]} →{" "}
      <InstantLink href={page.href} className={quietLinkClass}>
        {page.label}
      </InstantLink>
    </p>
  );
}
