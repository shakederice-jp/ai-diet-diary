import { InstantLink } from "@/components/instant-link";
import { MEMOLEVER_GUIDE } from "@/lib/guide-links";
import { LEGAL_PAGES } from "@/lib/legal";
import { OPERATOR_NAME } from "@/lib/site";

// 姉妹サイト(2026/11/19新設): 大手町調査室九課の全サイトへの相互リンク。
const SISTER_SITES: [string, string][] = [
  ["IPO分析アプリ(日本版)", "https://finance-tower.com/ipo-jp"],
  ["IPO分析アプリ(米国版)", "https://finance-tower.com/ipo-us"],
  ["IPO投資の教科書", "https://finance-tower.com/learn"],
  ["会員登録ガイド", "https://finance-tower.com/guide"],
  ["中学生・高校生のためのお金の流れ入門", "https://finance-tower.com/money-flow"],
  ["大学生向け 人生設計・マネープラン入門", "https://finance-tower.com/students"],
  ["大手町調査室九課", "https://finance-tower.com"],
];

const linkClass =
  "inline-flex min-h-8 items-center text-xs text-[#8A7360] underline decoration-[#C4B39A] underline-offset-4 hover:text-[#F5821F]";

const howtoLinkClass =
  "inline-flex min-h-11 items-center text-xs text-[#8A7360] underline decoration-[#C4B39A] underline-offset-4 hover:text-[#F5821F]";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm text-zinc-700">運営：{OPERATOR_NAME}</p>
      <nav aria-label="法務" className="mt-2 flex flex-col">
        <InstantLink href={MEMOLEVER_GUIDE.href} className={howtoLinkClass}>
          {MEMOLEVER_GUIDE.label}
        </InstantLink>
        <InstantLink href="/howto" className={howtoLinkClass}>
          使い方
        </InstantLink>
        {LEGAL_PAGES.map((page) => (
          <InstantLink key={page.href} href={page.href} className={linkClass}>
            {page.label}
          </InstantLink>
        ))}
      </nav>
      <nav aria-label="姉妹サイト" className="mt-2 flex flex-col">
        <p className="text-xs text-zinc-500">姉妹サイト</p>
        {SISTER_SITES.map(([name, url]) => (
          <a key={url} href={url} className={linkClass}>
            {name}
          </a>
        ))}
      </nav>
    </div>
  );
}
