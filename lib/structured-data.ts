import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { APP_NAME, APP_NAME_EN, APP_SUBTITLE } from "@/lib/app-title";
import { OPERATOR_NAME, SITE_URL } from "@/lib/site";

export function pageUrl(href: string) {
  if (href === "/") {
    return SITE_URL;
  }
  return `${SITE_URL}${href}`;
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: OPERATOR_NAME,
    url: SITE_URL,
  };
}

function organizationRef() {
  return { "@id": ORGANIZATION_ID };
}

export function breadcrumbNode(items: readonly BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: pageUrl(item.href),
    })),
  };
}

export function guideStructuredData(input: {
  name: string;
  description: string;
  path: string;
  dateModified: string;
  breadcrumbs: readonly BreadcrumbItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      {
        "@type": "WebPage",
        name: input.name,
        description: input.description,
        url: pageUrl(input.path),
        inLanguage: "ja",
        dateModified: input.dateModified,
        publisher: organizationRef(),
        author: organizationRef(),
      },
      breadcrumbNode(input.breadcrumbs),
    ],
  };
}

export function landingGraph(input: {
  description: string;
  faqs: readonly { question: string; answer: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: APP_NAME,
        alternateName: [APP_NAME_EN, APP_SUBTITLE],
        url: SITE_URL,
        inLanguage: "ja",
      },
      organizationNode(),
      {
        "@type": "WebApplication",
        name: APP_NAME,
        alternateName: [APP_SUBTITLE, APP_NAME_EN],
        url: SITE_URL,
        description: input.description,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        inLanguage: "ja",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "JPY",
        },
        publisher: organizationRef(),
      },
      {
        "@type": "FAQPage",
        mainEntity: input.faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
