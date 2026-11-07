import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GUIDE_PAGE_SOURCE_IDS, guideUpdatedLabel, type GuideUpdatedHref } from "@/lib/guide-meta";
import { APP_DISCLAIMER, OPERATOR_NAME } from "@/lib/site";

export function GuideAbout({ href }: { href: GuideUpdatedHref }) {
  return (
    <section aria-labelledby={`about-${href.slice(1)}`} className="text-[11px] leading-5 text-[#6B4A32]">
      <h2 id={`about-${href.slice(1)}`} className="text-xs font-medium text-[#6B4A32]">
        このページについて
      </h2>
      <p className="mt-1">最終更新日: {guideUpdatedLabel(href)}</p>
      <p>運営：{OPERATOR_NAME}</p>
      <GuideSourceList
        sources={GUIDE_PAGE_SOURCE_IDS[href].map((id) => ({ id }))}
        heading={href === "/eating-out" ? "参考資料" : "出典・参考資料"}
      />
      {href === "/eating-out" ? <p>公開されている栄養情報や、成分表をもとにした推定を含みます。</p> : null}
      <p>掲載の数値は目安で、一部は推定です。{APP_DISCLAIMER}</p>
    </section>
  );
}
