import { InstantLink } from "@/components/instant-link";
import { GUIDE_LINKS, type GuideLink } from "@/lib/guide-links";

const BANNER_COPY: Record<GuideLink["href"], { description: string; featured?: boolean }> = {
  "/howto": {
    description: "はじめての方へ。入力から見方まで、やさしく解説します",
  },
  "/guide": {
    description: "AIのカロリー推定、週の上限の考え方、続けるコツを記事で紹介",
    featured: true,
  },
  "/eating-out": {
    description: "外食メニューのカロリーの目安と、選ぶときのヒント",
  },
  "/sweets": {
    description: "お菓子やスイーツ102品を、◎○△でくらべられます",
  },
  "/staples": {
    description: "量ごとのカロリーを、ひと目で確認できます",
  },
};

const iconProps = {
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  className: "h-6 w-6 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function BannerIcon({ href }: { href: GuideLink["href"] }) {
  if (href === "/howto") {
    return (
      <svg {...iconProps}>
        <path d="M6 5.5h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 18 15.5H10l-3.5 3v-3H6A1.5 1.5 0 0 1 4.5 14V7A1.5 1.5 0 0 1 6 5.5z" />
        <path d="M12 8.2a1.7 1.7 0 0 1 1.6 1.5c0 1.1-1.6 1.3-1.6 2.6" />
        <circle cx="12" cy="14.6" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (href === "/guide") {
    return (
      <svg {...iconProps}>
        <path d="M4.5 6.2c2.2-.8 4-.4 7.5.9 3.5-1.3 5.3-1.7 7.5-.9v11.2c-2.2-.8-4-.4-7.5.9-3.5-1.3-5.3-1.7-7.5-.9V6.2z" />
        <path d="M12 7.1v11.2" />
      </svg>
    );
  }
  if (href === "/eating-out") {
    return (
      <svg {...iconProps}>
        <path d="M8 3.5v4.2M10 3.5v4.2M12 3.5v4.2" />
        <path d="M8 7.7h4" />
        <path d="M10 7.7V20" />
        <path d="M16.5 3.5c1.4 2.4 1.4 4.6 0 6.4V20" />
      </svg>
    );
  }
  if (href === "/sweets") {
    return (
      <svg {...iconProps}>
        <path d="M8 10.5c.2-2.4 1.6-3.8 4-3.8s3.8 1.4 4 3.8" />
        <path d="M7.2 10.5h9.6l-.9 7.2H8.1l-.9-7.2z" />
        <path d="M9 14.2h6" />
      </svg>
    );
  }
  return (
    <svg {...iconProps}>
      <path d="M5 10.5h14c-.8 4.2-3.4 6.3-7 6.3s-6.2-2.1-7-6.3z" />
      <path d="M8.2 10.5c.4-2.4 1.6-4 3.8-4s3.4 1.6 3.8 4" />
    </svg>
  );
}

export function GuideBanners({
  className = "",
  showHeading = false,
}: {
  className?: string;
  showHeading?: boolean;
}) {
  return (
    <section className={className} aria-labelledby={showHeading ? "guide-banner-heading" : undefined}>
      {showHeading ? (
        <h2 id="guide-banner-heading" className="mb-3 text-xs font-medium text-[#6B4A32]">
          ガイド・目安
        </h2>
      ) : null}
      <div className="flex flex-col gap-4">
        {GUIDE_LINKS.map((link) => {
          const copy = BANNER_COPY[link.href];
          const featured = Boolean(copy.featured);
          return (
            <InstantLink
              key={link.href}
              href={link.href}
              className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B4A32] ${
                featured
                  ? "border-[#F27A1A] bg-gradient-to-br from-[#FFB05A] to-[#F27A1A] text-white hover:border-[#D85A08]"
                  : "border-[#F27A1A] bg-[#FFF8EF] text-[#6B4A32] hover:border-[#D85A08]"
              }`}
            >
              <BannerIcon href={link.href} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-5">{link.label}</span>
                <span className={`mt-0.5 block text-xs leading-5 ${featured ? "text-white/90" : "text-[#8A6A52]"}`}>
                  {copy.description}
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-base">
                →
              </span>
            </InstantLink>
          );
        })}
      </div>
    </section>
  );
}
