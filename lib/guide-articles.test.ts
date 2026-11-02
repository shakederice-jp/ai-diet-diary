import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GUIDE_ARTICLES, guideArticleCharCount } from "./guide-articles";

const SLUGS = [
  "what-is-memolever",
  "ai-calorie",
  "weekly-limit",
  "record-diet-tips",
  "health-planet",
  "voice-and-bulk-input",
] as const;

const BANNED = ["必ず痩せる", "必ず痩せ", "kg減", "治療", "病気", "口コミ", "利用者の声"];

function articleText(article: (typeof GUIDE_ARTICLES)[number]) {
  return [article.title, article.description, ...article.lead, ...article.blocks.flatMap((block) => {
    if (block.type === "h2" || block.type === "p") {
      return [block.text];
    }
    if (block.type === "ul") {
      return [...block.items];
    }
    return block.items.map((item) => item.label);
  })].join("\n");
}

describe("guide articles", () => {
  it("lists the six public slugs", () => {
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
      assert.ok(headings.length >= 3 && headings.length <= 5, article.slug);
      assert.ok(article.lead.length >= 2 && article.lead.length <= 3, article.slug);
      assert.equal(article.updatedOn, "2026-11-02");
      assert.ok(article.description.length > 0);
      const text = articleText(article);
      for (const word of BANNED) {
        assert.equal(text.includes(word), false, `${article.slug} ${word}`);
      }
      for (const slug of article.related) {
        assert.notEqual(slug, article.slug);
        assert.ok(GUIDE_ARTICLES.some((item) => item.slug === slug), slug);
      }
    }
  });
});
