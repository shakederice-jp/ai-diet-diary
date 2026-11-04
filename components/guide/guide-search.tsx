"use client";

import { useState } from "react";
import { InstantLink } from "@/components/instant-link";
import { matchGuideSearch, type GuideSearchDoc } from "@/lib/guide-search";

export function GuideArticleSearch({ docs }: { docs: readonly GuideSearchDoc[] }) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const results = matchGuideSearch(docs, query);

  return (
    <section id="search" className="mt-12 scroll-mt-6" aria-labelledby="search-heading">
      <h2 id="search-heading" className="text-2xl font-semibold text-[#F27A1A]">
        記事を探す
      </h2>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="タイトルやキーワード"
        aria-label="記事を探す"
        className="mt-4 w-full rounded-2xl border border-[#E7DCC8] bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-[#F27A1A]"
      />
      <div className="mt-4" aria-live="polite">
        {trimmed.length > 0 && results.length === 0 ? (
          <p className="text-base leading-8 text-zinc-800">見つかりませんでした。テーマから探してみてください</p>
        ) : null}
        {results.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {results.map((doc) => (
              <li key={doc.href}>
                <InstantLink href={doc.href} className="block rounded-2xl bg-[#FBF6EE] p-4 hover:bg-[#E7DCC8]">
                  <span className="text-lg font-medium leading-7 text-zinc-950">{doc.title}</span>
                  <span className="mt-2 block text-base leading-7 text-zinc-700">{doc.summary}</span>
                </InstantLink>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
