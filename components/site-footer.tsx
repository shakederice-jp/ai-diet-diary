import { InstantLink } from "@/components/instant-link";
import { LEGAL_PAGES } from "@/lib/legal";
import { OPERATOR_NAME } from "@/lib/site";

const linkClass =
  "inline-flex min-h-8 items-center text-xs text-[#8A7360] underline decoration-[#C4B39A] underline-offset-4 hover:text-[#F5821F]";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm text-zinc-700">運営：{OPERATOR_NAME}</p>
      <nav aria-label="法務" className="mt-2 flex flex-col">
        {LEGAL_PAGES.map((page) => (
          <InstantLink key={page.href} href={page.href} className={linkClass}>
            {page.label}
          </InstantLink>
        ))}
      </nav>
    </div>
  );
}
