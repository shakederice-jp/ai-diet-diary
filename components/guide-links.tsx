"use client";

import { InstantLink } from "@/components/instant-link";
import { GUIDE_LINKS, type GuideLink } from "@/lib/guide-links";

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
    <nav aria-label="案内" className={`flex flex-wrap items-center ${className}`}>
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
