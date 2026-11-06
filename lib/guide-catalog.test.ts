import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GUIDE_ARTICLES } from "./guide-articles";
import {
  chapterNeighbors,
  guideChapterEntries,
  guideSearchDocs,
  isGuideChapterPublished,
  newestGuideArticles,
  publishedGuideChapters,
  sameChapterArticles,
} from "./guide-catalog";
import { GUIDE_CHAPTERS } from "./guide-chapters";
import { assertGuideCatalog, guideArticleRecordReport, guideSourceRecordErrors } from "./guide-check";
import { matchGuideSearch } from "./guide-search";
import {
  externalCitationUrls,
  GUIDE_COMPANY_SOURCE_NOTE,
  GUIDE_INTERNAL_SOURCE_LABEL,
  GUIDE_SOURCES,
  guideSourceFootnote,
  guideSourcePublisherLabel,
} from "./guide-sources";

describe("guide chapters and sources", () => {
  it("publishes chapters only when they have at least three entries", () => {
    assert.deepEqual(
      publishedGuideChapters().map((chapter) => chapter.slug),
      ["worries", "basics", "seasons", "calorie-guides", "using-memolever"],
    );
    assert.equal(isGuideChapterPublished("worries"), true);
    assert.equal(guideChapterEntries("worries").length, 6);
    assert.equal(isGuideChapterPublished("basics"), true);
    assert.equal(guideChapterEntries("basics").length, 3);
    assert.equal(isGuideChapterPublished("seasons"), true);
    assert.equal(guideChapterEntries("seasons").length, 3);
    assert.equal(isGuideChapterPublished("calorie-guides"), true);
    assert.deepEqual(
      guideChapterEntries("calorie-guides").map((entry) => entry.href),
      [
        "/eating-out",
        "/sweets",
        "/staples",
        "/guide/drinks-calorie-guide",
        "/guide/alcohol-calorie-guide",
        "/guide/home-dishes-calorie-guide",
      ],
    );
    assert.equal(guideChapterEntries("calorie-guides").length, 6);
    assert.equal(isGuideChapterPublished("using-memolever"), true);
    assert.equal(guideChapterEntries("using-memolever").length, 7);
    const chapterSlugs: readonly string[] = GUIDE_CHAPTERS.map((chapter) => chapter.slug);
    assert.equal(chapterSlugs.includes("theme"), false);
    assert.equal(GUIDE_ARTICLES.some((article) => article.slug === "theme"), false);
  });

  it("orders articles inside a chapter and picks neighbors", () => {
    const weekly = GUIDE_ARTICLES.find((article) => article.slug === "weekly-limit");
    assert.ok(weekly);
    const neighbors = chapterNeighbors(weekly);
    assert.equal(neighbors.prev, null);
    assert.equal(neighbors.next?.slug, "record-diet-tips");
    assert.deepEqual(
      sameChapterArticles(weekly).map((article) => article.slug),
      ["record-diet-tips", "recording-diet-vs-ai", "why-diet-log-stops", "eating-out-recording", "after-overeating"],
    );
    assert.deepEqual(
      newestGuideArticles(5).map((article) => article.slug),
      [
        "drinks-calorie-guide",
        "alcohol-calorie-guide",
        "home-dishes-calorie-guide",
        "why-diet-log-stops",
        "eating-out-recording",
      ],
    );
    const calorie = GUIDE_ARTICLES.find((article) => article.slug === "calorie-basics");
    assert.ok(calorie);
    assert.deepEqual(
      sameChapterArticles(calorie).map((article) => article.slug),
      ["weight-fluctuation", "weighing-timing"],
    );
    const holiday = GUIDE_ARTICLES.find((article) => article.slug === "new-year-holidays");
    assert.ok(holiday);
    assert.deepEqual(
      sameChapterArticles(holiday).map((article) => article.slug),
      ["travel-events-week", "new-year-start"],
    );
  });

  it("keeps registered sources and external citations", () => {
    assert.deepEqual(guideSourceRecordErrors(GUIDE_SOURCES), []);
    assert.deepEqual(
      GUIDE_SOURCES.map((source) => source.checkedAt),
      ["2026-11-04", "2026-11-04", "2026-11-04", "2026-11-04", "2026-11-05", "2026-11-05", "2026-11-05", "2026-11-05", "2026-11-05", "2026-11-05", "2026-11-05", "2026-11-05", "2026-11-06", "2026-11-06", "2026-11-06"],
    );
    const eating = GUIDE_ARTICLES.find((article) => article.slug === "eating-out-recording");
    assert.ok(eating);
    assert.deepEqual(externalCitationUrls(eating.sources), [
      "https://www.caa.go.jp/policies/policy/food_labeling/nutrient_declearation/",
      "https://www.mext.go.jp/content/20230428-mxt_kagsei-mext_00001_011.pdf",
    ]);
    const after = GUIDE_ARTICLES.find((article) => article.slug === "after-overeating");
    assert.ok(after);
    assert.deepEqual(externalCitationUrls(after.sources), [
      "https://tanita.com/posts/why-do-my-measurements-change-throughout-the-day",
    ]);
    const calorie = GUIDE_ARTICLES.find((article) => article.slug === "calorie-basics");
    assert.ok(calorie);
    assert.deepEqual(externalCitationUrls(calorie.sources), [
      "https://www.mhlw.go.jp/content/10904750/001734207.pdf",
      "https://www.e-healthnet.mhlw.go.jp/information/keywords/body-mass-index",
      "https://kennet.mhlw.go.jp/information/information/exercise/s-00-012.html",
      "https://www.mext.go.jp/content/20230428-mxt_kagsei-mext_00001_011.pdf",
    ]);
    const ai = GUIDE_ARTICLES.find((article) => article.slug === "ai-calorie");
    assert.ok(ai);
    assert.deepEqual(externalCitationUrls(ai.sources), [
      "https://www.mext.go.jp/content/20230428-mxt_kagsei-mext_00001_011.pdf",
    ]);
    const intro = GUIDE_ARTICLES.find((article) => article.slug === "what-is-memolever");
    assert.ok(intro);
    assert.deepEqual(externalCitationUrls(intro.sources), []);
    assert.equal(guideSourcePublisherLabel(GUIDE_SOURCES[3]), GUIDE_INTERNAL_SOURCE_LABEL);
    assert.equal(guideSourceFootnote("company"), GUIDE_COMPANY_SOURCE_NOTE);
    assert.equal(guideSourceFootnote("official"), null);
    const report = guideArticleRecordReport(GUIDE_ARTICLES);
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.warnings, [
      "記事「weighing-timing」は栄養・健康に関する本文（needsOfficial）ですが、type: official の出典がありません。",
    ]);
  });

  it("fails when sources are empty, unknown, or not https", () => {
    assert.throws(
      () => assertGuideCatalog([{ slug: "sample", chapter: "worries", sources: [] }]),
      /出典（sources）が空です/,
    );
    assert.throws(
      () => assertGuideCatalog([{ slug: "sample", chapter: "worries", sources: [{ id: "not-registered" }] }]),
      /台帳にありません/,
    );
    assert.throws(
      () => assertGuideCatalog([{ slug: "theme", chapter: "worries", sources: [{ id: "memolever-howto" }] }]),
      /予約語「theme」/,
    );
    const urlErrors = guideSourceRecordErrors([
      {
        id: "bad-url",
        type: "official",
        publisher: "例",
        title: "例",
        url: "http://example.com/guide",
        checkedAt: "2026-11-04",
      },
    ]);
    assert.match(urlErrors.join("\n"), /https:\/\//);
  });

  it("warns when a nutrition article has no official source", () => {
    const warnings: string[] = [];
    assert.doesNotThrow(() =>
      assertGuideCatalog(
        [
          {
            slug: "sample",
            chapter: "basics",
            needsOfficial: true,
            sources: [{ id: "memolever-howto" }],
          },
        ],
        (message) => warnings.push(message),
      ),
    );
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /needsOfficial/);
    assert.match(warnings[0], /official/);
  });

  it("filters articles on the client search fields", () => {
    const docs = guideSearchDocs();
    assert.equal(matchGuideSearch(docs, "  ").length, 0);
    assert.equal(matchGuideSearch(docs, "存在しない語句xyz").length, 0);
    const hit = matchGuideSearch(docs, "health planet");
    assert.deepEqual(
      hit.map((doc) => doc.href),
      ["/guide/health-planet"],
    );
    const both = matchGuideSearch(docs, "週 上限");
    assert.ok(both.some((doc) => doc.href === "/guide/weekly-limit"));
  });
});
