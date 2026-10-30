import { guideUpdatedLabel, type GuideUpdatedHref } from "@/lib/guide-meta";
import { APP_DISCLAIMER, OPERATOR_NAME } from "@/lib/site";

const linkClass =
  "text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

const MEXT = {
  href: "https://fooddb.mext.go.jp/",
  label: "文部科学省「日本食品標準成分表(八訂)増補2023」",
};

const MAFF = {
  href: "https://www.maff.go.jp/j/balance_guide/",
  label: "農林水産省「食事バランスガイド」",
};

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {label}
    </a>
  );
}

export function GuideAbout({ href }: { href: GuideUpdatedHref }) {
  return (
    <section aria-labelledby={`about-${href.slice(1)}`} className="text-[11px] leading-5 text-[#6B4A32]">
      <h2 id={`about-${href.slice(1)}`} className="text-xs font-medium text-[#6B4A32]">
        このページについて
      </h2>
      <p className="mt-1">最終更新日: {guideUpdatedLabel(href)}</p>
      <p>運営：{OPERATOR_NAME}</p>
      <p>
        出典・参考: <SourceLink {...MEXT} />
        {href === "/sweets" ? (
          <>
            {" "}
            / <SourceLink {...MAFF} />
          </>
        ) : null}
      </p>
      {href === "/eating-out" ? <p>公開されている栄養情報や、成分表をもとにした推定を含みます。</p> : null}
      <p>掲載の数値は目安で、一部は推定です。{APP_DISCLAIMER}</p>
    </section>
  );
}
