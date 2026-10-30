import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SWEETS_GENRES,
  SWEETS_ITEMS,
  filterSweetsItems,
  sweetsMark,
} from "./sweets-guide";

describe("sweets guide data", () => {
  it("keeps 102 items and the expected marks", () => {
    assert.equal(SWEETS_ITEMS.length, 102);
    assert.equal(new Set(SWEETS_ITEMS.map((item) => item.name)).size, 102);
    const marks = { "◎": 0, "○": 0, "△": 0 };
    for (const item of SWEETS_ITEMS) {
      marks[sweetsMark(item.kcal)] += 1;
    }
    assert.deepEqual(marks, { "◎": 13, "○": 54, "△": 35 });
    assert.deepEqual(
      SWEETS_GENRES.map((genre) => {
        const rows = SWEETS_ITEMS.filter((item) => item.genre === genre);
        return [genre, rows.filter((item) => sweetsMark(item.kcal) === "◎").length, rows.filter((item) => sweetsMark(item.kcal) === "○").length, rows.filter((item) => sweetsMark(item.kcal) === "△").length];
      }),
      [
        ["米菓", 4, 9, 0],
        ["クッキー類", 1, 11, 0],
        ["和菓子", 0, 16, 3],
        ["ケーキ", 0, 5, 11],
        ["焼き菓子・カフェ", 2, 6, 11],
        ["菓子パン", 0, 2, 7],
        ["ナッツ・いも", 6, 5, 3],
      ],
    );
  });

  it("uses the snack midpoint boundaries", () => {
    assert.equal(sweetsMark([100, 100]), "◎");
    assert.equal(sweetsMark([101, 101]), "○");
    assert.equal(sweetsMark([200, 200]), "○");
    assert.equal(sweetsMark([201, 201]), "△");
    assert.equal(sweetsMark([160, 240]), "○");
  });

  it("sorts by the midpoint and can find no rows", () => {
    const sorted = filterSweetsItems(SWEETS_ITEMS, { genre: "すべて", mark: "すべて", sort: "calorie" });
    assert.equal(sorted[0]?.name, "レーズン");
    assert.equal(sorted.at(-1)?.name, "パフェ");
    const empty = filterSweetsItems(SWEETS_ITEMS, { genre: "ケーキ", mark: "◎だけ", sort: "standard" });
    assert.equal(empty.length, 0);
    const standard = filterSweetsItems(SWEETS_ITEMS, { genre: "すべて", mark: "すべて", sort: "standard" });
    assert.equal(standard[0]?.name, "しょうゆせんべい");
  });
});
