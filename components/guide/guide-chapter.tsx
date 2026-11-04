import { GuideStartButton } from "@/components/guide/guide-actions";
import { GuideShell, guideCrumbItems } from "@/components/guide/guide-shell";
import { InstantLink } from "@/components/instant-link";
import { guideChapterEntries, isGuideChapterPublished } from "@/lib/guide-catalog";
import {
  guideChapterPath,
  orderedGuideChapters,
  type GuideChapter,
} from "@/lib/guide-chapters";
import { formatGuideIsoLabel } from "@/lib/guide-meta";
import { guideChapterStructuredData } from "@/lib/structured-data";

export function guideChapterDocumentTitle(name: string) {
  return `${name}｜メモレバ ガイド`;
}

export function GuideChapterView({ chapter }: { chapter: GuideChapter }) {
  const entries = guideChapterEntries(chapter.slug);
  const published = isGuideChapterPublished(chapter.slug);
  const breadcrumbs = guideCrumbItems({ label: chapter.name, href: guideChapterPath(chapter.slug) });
  const themes = orderedGuideChapters();

  return (
    <GuideShell
      breadcrumbs={breadcrumbs}
      jsonLd={guideChapterStructuredData({
        name: guideChapterDocumentTitle(chapter.name),
        description: chapter.description,
        path: guideChapterPath(chapter.slug),
        breadcrumbs,
      })}
    >
      <nav className="mt-6" aria-labelledby="other-themes-heading">
        <h2 id="other-themes-heading" className="text-sm font-medium text-[#C65A0A]">
          他のテーマ
        </h2>
        <ul className="mt-2 flex flex-col gap-2">
          {themes.map((item) => {
            const ready = isGuideChapterPublished(item.slug);
            const current = item.slug === chapter.slug;
            const label = `${item.key} ${item.name}`;
            if (current) {
              return (
                <li key={item.slug}>
                  <span aria-current="page" className="inline-flex min-h-11 items-center text-base font-medium text-[#3A2A22]">
                    {label}
                  </span>
                </li>
              );
            }
            if (!ready) {
              return (
                <li key={item.slug}>
                  <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-2 text-base text-[#8A7360]">
                    {label}
                    <span className="rounded-full bg-[#E4DDD4] px-2 py-0.5 text-xs">準備中</span>
                  </span>
                </li>
              );
            }
            return (
              <li key={item.slug}>
                <InstantLink
                  href={guideChapterPath(item.slug)}
                  className="inline-flex min-h-11 items-center text-base font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
                >
                  {label}
                </InstantLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <header className="mt-6">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#3A2A22]">{chapter.name}</h1>
        <p className="mt-4 text-base leading-8 text-zinc-800">{chapter.description}</p>
        {published ? null : (
          <p className="mt-4 rounded-2xl bg-[#E4DDD4] px-4 py-3 text-base font-medium text-[#6B4A32]">準備中</p>
        )}
      </header>
      {entries.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.href}>
              <InstantLink href={entry.href} className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]">
                <span className="text-lg font-medium leading-7 text-zinc-950">{entry.title}</span>
                <span className="mt-2 line-clamp-2 block text-base leading-7 text-zinc-700">{entry.summary}</span>
                <span className="mt-2 block text-sm text-[#6B4A32]">更新日: {formatGuideIsoLabel(entry.updatedOn)}</span>
              </InstantLink>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-10">
        <GuideStartButton />
      </div>
    </GuideShell>
  );
}
