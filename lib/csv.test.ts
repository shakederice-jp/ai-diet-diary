import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, csvDocument } from "./csv";

test("csv cells quote commas and neutralize formula prefixes", () => {
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("=1+1"), "\"'=1+1\"");
  assert.equal(csvCell("+1"), "\"'+1\"");
  assert.equal(csvCell("-2"), "\"'-2\"");
  assert.equal(csvCell("@cmd"), "\"'@cmd\"");
  assert.equal(csvCell(300), '"300"');
  assert.equal(csvCell(null), '""');
});

test("csv document starts with a UTF-8 BOM", () => {
  const file = csvDocument([
    ["日付", "日記"],
    ["2026-10-01", "こんにちは"],
  ]);
  assert.equal(file.charCodeAt(0), 0xfeff);
  assert.match(file, /"日付","日記"/);
});
