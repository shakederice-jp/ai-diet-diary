export type GuideSearchDoc = {
  href: string;
  title: string;
  summary: string;
  keywords?: readonly string[];
};

/** タイトル・要約・keywords を対象にする。空白区切りは、すべての語を含む記事に絞る。 */
export function matchGuideSearch(docs: readonly GuideSearchDoc[], query: string) {
  const tokens = query.trim().toLocaleLowerCase("ja").split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return [];
  }
  return docs.filter((doc) => {
    const haystack = [doc.title, doc.summary, ...(doc.keywords ?? [])].join("\n").toLocaleLowerCase("ja");
    return tokens.every((token) => haystack.includes(token));
  });
}
