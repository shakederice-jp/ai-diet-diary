import assert from "node:assert/strict";
import test from "node:test";
import { shareExcerpt, textLength } from "./diary-text";

test("share excerpt keeps short diary text", () => {
  assert.equal(shareExcerpt("  今日も記録できた  "), "今日も記録できた");
});

test("share excerpt cuts inside 80 characters and adds an ellipsis", () => {
  const body = `${"あ".repeat(40)}。${"い".repeat(80)}`;
  const excerpt = shareExcerpt(body);
  assert.ok(textLength(excerpt) <= 80);
  assert.ok(excerpt.endsWith("…"));
  assert.ok(excerpt.startsWith("あ"));
});
