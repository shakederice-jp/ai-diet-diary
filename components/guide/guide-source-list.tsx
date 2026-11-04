import { InstantLink } from "@/components/instant-link";
import { formatGuideIsoLabel } from "@/lib/guide-meta";
import {
  guideSourceFootnote,
  guideSourcePublisherLabel,
  isExternalGuideSource,
  resolveGuideSourceRefs,
} from "@/lib/guide-sources";

const linkClass =
  "font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]";

export function GuideSourceList({ sources }: { sources: readonly { id: string; note?: string }[] }) {
  const items = resolveGuideSourceRefs(sources);

  return (
    <section className="mt-12" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="text-2xl font-semibold text-[#F27A1A]">
        出典・参考資料
      </h2>
      <ol className="mt-4 flex flex-col gap-3">
        {items.map((item) => {
          const external = isExternalGuideSource(item.source);
          const footnote = guideSourceFootnote(item.source.type);
          return (
            <li key={item.source.id} id={`source-${item.number}`} className="rounded-2xl bg-[#FBF6EE] p-4">
              <p className="text-sm font-medium text-[#C65A0A]">
                [{item.number}] {guideSourcePublisherLabel(item.source)}
              </p>
              <p className="mt-1 text-base leading-7 text-zinc-950">
                {external ? (
                  <a href={item.source.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {item.source.title}
                  </a>
                ) : (
                  <InstantLink href={item.source.url} className={linkClass}>
                    {item.source.title}
                  </InstantLink>
                )}
              </p>
              <p className="mt-1 text-sm text-[#6B4A32]">確認日 {formatGuideIsoLabel(item.source.checkedAt)}</p>
              {item.note ? <p className="mt-2 text-sm leading-6 text-zinc-700">{item.note}</p> : null}
              {item.source.note ? <p className="mt-2 text-sm leading-6 text-zinc-700">{item.source.note}</p> : null}
              {footnote ? <p className="mt-2 text-sm leading-6 text-zinc-700">{footnote}</p> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
