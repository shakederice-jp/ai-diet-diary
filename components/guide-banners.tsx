import { InstantLink } from "@/components/instant-link";
import { guideChapterEntries, isGuideChapterPublished } from "@/lib/guide-catalog";
import { guideChapterPath, orderedGuideChapters, type GuideChapter, type GuideChapterKey } from "@/lib/guide-chapters";
import { MEMOLEVER_GUIDE } from "@/lib/guide-links";

const HOWTO = { href: "/howto", label: "このサイトの使い方" } as const;

const STARTER_COPY = {
  "/howto": "はじめての方へ。入力から見方まで、やさしく解説します",
  "/guide": "AIのカロリー推定、週の上限の考え方、続けるコツを記事で紹介",
} as const;

/** バナー用の1行説明。件数と公開状態は章データから計算する。 */
const THEME_LINE: Record<GuideChapter["slug"], string> = {
  worries: "続かない・食べすぎたときの考え方",
  basics: "カロリーや体重の変動を、出典つきで",
  seasons: "年末年始や新生活の食生活の整え方",
  "calorie-guides": "外食・お菓子・主食などの早見表",
  "using-memolever": "機能の紹介とAIの仕組み",
};

const iconProps = {
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function StarterIcon({ href }: { href: "/howto" | "/guide" }) {
  if (href === "/howto") {
    return (
      <svg {...iconProps} className="h-6 w-6 shrink-0">
        <path d="M6 5.5h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 18 15.5H10l-3.5 3v-3H6A1.5 1.5 0 0 1 4.5 14V7A1.5 1.5 0 0 1 6 5.5z" />
        <path d="M12 8.2a1.7 1.7 0 0 1 1.6 1.5c0 1.1-1.6 1.3-1.6 2.6" />
        <circle cx="12" cy="14.6" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...iconProps} className="h-6 w-6 shrink-0">
      <path d="M4.5 6.2c2.2-.8 4-.4 7.5.9 3.5-1.3 5.3-1.7 7.5-.9v11.2c-2.2-.8-4-.4-7.5.9-3.5-1.3-5.3-1.7-7.5-.9V6.2z" />
      <path d="M12 7.1v11.2" />
    </svg>
  );
}

function ThemeIcon({ chapterKey, className }: { chapterKey: GuideChapterKey; className: string }) {
  if (chapterKey === "A") {
    return (
      <svg {...iconProps} className={className}>
        <path d="M5 6.2h9.2A1.4 1.4 0 0 1 15.6 7.6v4.2a1.4 1.4 0 0 1-1.4 1.4H8.2L6 15.4v-2.2H5A1.4 1.4 0 0 1 3.6 11.8V7.6A1.4 1.4 0 0 1 5 6.2z" />
        <path d="M8.1 9.7c.35-.85 1.05-1.05 1.55-.35.5-.7 1.2-.5 1.55.35.25.7-.35 1.4-1.55 2.1-1.2-.7-1.8-1.4-1.55-2.1z" />
      </svg>
    );
  }
  if (chapterKey === "B") {
    return (
      <svg {...iconProps} className={className}>
        <path d="M6.5 4.8h9.2A1.3 1.3 0 0 1 17 6.1V19a1.3 1.3 0 0 1-1.3 1.3H6.5A1.3 1.3 0 0 1 5.2 19V6.1A1.3 1.3 0 0 1 6.5 4.8z" />
        <path d="M8.2 8.4h6.2M8.2 11.4h6.2M8.2 14.4h4" />
      </svg>
    );
  }
  if (chapterKey === "C") {
    return (
      <svg {...iconProps} className={className}>
        <rect x="4.2" y="5.4" width="15.6" height="14" rx="1.6" />
        <path d="M4.2 9.4h15.6M8 3.6v3.4M16 3.6v3.4" />
      </svg>
    );
  }
  if (chapterKey === "D") {
    return (
      <svg {...iconProps} className={className}>
        <path d="M8 3.8v4M10 3.8v4M12 3.8v4" />
        <path d="M8 7.8h4" />
        <path d="M10 7.8V20" />
        <path d="M16.4 3.8c1.3 2.2 1.3 4.3 0 6V20" />
      </svg>
    );
  }
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="2.7" />
      <path d="M12 4.1v1.9M12 18v1.9M4.1 12h1.9M18 12h1.9M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4" />
    </svg>
  );
}

const starterClass =
  "flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B4A32]";

const themeLinkClass =
  "flex min-h-14 items-center gap-2 rounded-2xl border border-[#F27A1A] bg-[#FFF8EF] px-3 py-2 text-[#6B4A32] shadow-sm transition hover:-translate-y-0.5 hover:border-[#D85A08] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B4A32]";

const themeDisabledClass =
  "flex min-h-14 cursor-default items-center gap-2 rounded-2xl border border-[#D5CBBE] bg-[#E7E0D6] px-3 py-2 text-[#8A7360] shadow-sm";

function ThemeBanner({ chapter }: { chapter: GuideChapter }) {
  const total = guideChapterEntries(chapter.slug).length;
  const published = isGuideChapterPublished(chapter.slug);
  const iconClass = `h-5 w-5 shrink-0 ${published ? "text-[#F27A1A]" : "text-[#A89888]"}`;
  const body = (
    <>
      <ThemeIcon chapterKey={chapter.key} className={iconClass} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold leading-5">{chapter.name}</span>
          {published ? null : (
            <span className="shrink-0 rounded-full bg-[#D5CBBE] px-1.5 py-0.5 text-[10px] font-medium leading-4 text-[#6B4A32]">
              準備中
            </span>
          )}
        </span>
        <span className={`mt-0.5 block truncate text-xs leading-4 ${published ? "text-[#8A6A52]" : "text-[#A89888]"}`}>
          {THEME_LINE[chapter.slug]}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-[11px] font-medium leading-4">全{total}本</span>
        {published ? (
          <span aria-hidden="true" className="text-sm leading-4">
            →
          </span>
        ) : null}
      </span>
    </>
  );
  if (!published) {
    return (
      <div aria-disabled="true" className={themeDisabledClass}>
        {body}
      </div>
    );
  }
  return (
    <InstantLink href={guideChapterPath(chapter.slug)} className={themeLinkClass}>
      {body}
    </InstantLink>
  );
}

export function GuideBanners({
  className = "",
  idPrefix = "guide",
}: {
  className?: string;
  idPrefix?: string;
}) {
  const chapters = orderedGuideChapters();
  const starterId = `${idPrefix}-starter`;
  const themeId = `${idPrefix}-themes`;
  return (
    <div className={className}>
      <section aria-labelledby={starterId}>
        <h2 id={starterId} className="mb-3 text-xs font-medium text-[#6B4A32]">
          はじめての方へ
        </h2>
        <div className="flex flex-col gap-4">
          <InstantLink
            href={HOWTO.href}
            className={`${starterClass} border-[#F27A1A] bg-[#FFF8EF] text-[#6B4A32] hover:border-[#D85A08]`}
          >
            <StarterIcon href="/howto" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-5">{HOWTO.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-[#8A6A52]">{STARTER_COPY["/howto"]}</span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-base">
              →
            </span>
          </InstantLink>
          <InstantLink
            href={MEMOLEVER_GUIDE.href}
            className={`${starterClass} border-[#F27A1A] bg-gradient-to-br from-[#FFB05A] to-[#F27A1A] text-white hover:border-[#D85A08]`}
          >
            <StarterIcon href="/guide" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-5">{MEMOLEVER_GUIDE.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-white/90">{STARTER_COPY["/guide"]}</span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-base">
              →
            </span>
          </InstantLink>
        </div>
      </section>
      <section className="mt-5" aria-labelledby={themeId}>
        <h2 id={themeId} className="mb-3 text-xs font-medium text-[#6B4A32]">
          テーマから探す
        </h2>
        <div className="flex flex-col gap-2">
          {chapters.map((chapter) => (
            <ThemeBanner key={chapter.slug} chapter={chapter} />
          ))}
        </div>
        <InstantLink
          href="/guide#search"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
        >
          記事をキーワードで探す →
        </InstantLink>
      </section>
    </div>
  );
}
