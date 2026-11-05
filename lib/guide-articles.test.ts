import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GUIDE_ARTICLES, guideArticleCharCount, guideInlinePlainText } from "./guide-articles";
import { GUIDE_PAGES } from "./guide-links";
import { MEMOLEVER_GUIDE_UPDATED_ON } from "./guide-meta";

const SLUGS = [
  "what-is-memolever",
  "ai-calorie",
  "weekly-limit",
  "record-diet-tips",
  "health-planet",
  "voice-and-bulk-input",
  "recording-diet-vs-ai",
  "why-diet-log-stops",
  "eating-out-recording",
  "after-overeating",
] as const;

const ADDED_ON = "2026-11-05";
const ADDED = new Set<string>(["why-diet-log-stops", "eating-out-recording", "after-overeating"]);

const BANNED = ["必ず痩せる", "必ず痩せ", "kg減", "治療", "病気", "口コミ", "利用者の声"];

function articleText(article: (typeof GUIDE_ARTICLES)[number]) {
  return [article.title, article.description, ...article.lead, ...article.blocks.flatMap((block) => {
    if (block.type === "h2" || block.type === "h3") {
      return [block.text];
    }
    if (block.type === "p") {
      return [guideInlinePlainText(block.text)];
    }
    if (block.type === "ul") {
      return block.items.map((item) => guideInlinePlainText(item));
    }
    if (block.type === "links") {
      return block.items.map((item) => item.label);
    }
    if (block.type === "table") {
      return [block.caption, ...block.headers, ...block.rows.flat()];
    }
    return block.items.flatMap((item) => [item.question, guideInlinePlainText(item.answer)]);
  })].join("\n");
}

describe("guide articles", () => {
  it("lists the public slugs", () => {
    assert.deepEqual(
      GUIDE_ARTICLES.map((article) => article.slug),
      [...SLUGS],
    );
  });

  it("keeps length, headings, dates, and related links", () => {
    for (const article of GUIDE_ARTICLES) {
      const count = guideArticleCharCount(article);
      assert.ok(count >= 1200 && count <= 2000, `${article.slug} ${count}`);
      const headings = article.blocks.filter((block) => block.type === "h2");
      const headingMax = article.slug === "recording-diet-vs-ai" || article.slug === "eating-out-recording" ? 6 : 5;
      assert.ok(headings.length >= 3 && headings.length <= headingMax, `${article.slug} ${headings.length}`);
      const leadMin = article.slug === "recording-diet-vs-ai" || ADDED.has(article.slug) ? 1 : 2;
      assert.ok(article.lead.length >= leadMin && article.lead.length <= 3, article.slug);
      const updatedOn =
        article.slug === "recording-diet-vs-ai" ? "2026-11-03" : ADDED.has(article.slug) ? ADDED_ON : MEMOLEVER_GUIDE_UPDATED_ON;
      assert.equal(article.updatedOn, updatedOn);
      assert.ok(article.description.length > 0);
      const text = articleText(article);
      for (const word of BANNED) {
        assert.equal(text.includes(word), false, `${article.slug} ${word}`);
      }
      for (const slug of article.related) {
        assert.notEqual(slug, article.slug);
        if (slug.startsWith("/")) {
          assert.ok(GUIDE_PAGES.some((page) => page.href === slug), slug);
          continue;
        }
        assert.ok(GUIDE_ARTICLES.some((item) => item.slug === slug), slug);
      }
    }
  });

  it("links the paper-notebook comparison from the two existing articles", () => {
    for (const slug of ["what-is-memolever", "record-diet-tips"] as const) {
      const article = GUIDE_ARTICLES.find((item) => item.slug === slug);
      assert.ok(article);
      const linked = article.blocks.some(
        (block) =>
          block.type === "links" &&
          block.items.some(
            (item) => item.href === "/guide/recording-diet-vs-ai" && item.label === "紙の手帳との違いはこちら",
          ),
      );
      assert.equal(linked, true, slug);
    }
  });
});
