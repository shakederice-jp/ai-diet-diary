import { InstantLink } from "@/components/instant-link";
import { APP_NAME } from "@/lib/app-title";
import { guidePageByHref, type GuidePage } from "@/lib/guide-links";
import { SITE_URL } from "@/lib/site";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function guideBreadcrumbItems(href: GuidePage["href"]): BreadcrumbItem[] {
  const page = guidePageByHref(href);
  return [
    { label: APP_NAME, href: "/" },
    { label: page.label, href: page.href },
  ];
}

function itemUrl(href: string) {
  if (href === "/") {
    return SITE_URL;
  }
  return `${SITE_URL}${href}`;
}

export function Breadcrumbs({
  items,
  className = "",
}: {
  items: readonly BreadcrumbItem[];
  className?: string;
}) {
  const structured = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: itemUrl(item.href),
    })),
  };

  return (
    <nav aria-label="パンくずリスト" className={`max-w-full overflow-x-auto ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
      <ol className="flex w-max min-w-full flex-nowrap items-center gap-1 text-[13px] leading-5">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 ? (
                <span aria-hidden="true" className="text-[#8A7360]">
                  ›
                </span>
              ) : null}
              {current ? (
                <span aria-current="page" className="inline-flex min-h-8 items-center whitespace-nowrap text-[#6B4A32]">
                  {item.label}
                </span>
              ) : (
                <InstantLink
                  href={item.href}
                  className="inline-flex min-h-8 items-center whitespace-nowrap text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
                >
                  {item.label}
                </InstantLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
