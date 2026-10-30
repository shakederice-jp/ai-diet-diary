import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BREAD_NOTE,
  BREAD_ROWS,
  NOODLE_ROWS,
  OTHER_ROWS,
  PASTA_NOTE,
  RICE_NOTE,
  RICE_ROWS,
  otherKcalLabel,
} from "./staples-guide";

describe("staple calorie tables", () => {
  it("matches the rice portions and the savings line", () => {
    assert.deepEqual(
      RICE_ROWS.map((row) => [row.label, row.amount, row.kcal]),
      [
        ["お茶碗 小盛", "100g", 156],
        ["お茶碗 普通", "150g", 234],
        ["お茶碗 大盛", "200g", 312],
        ["丼のご飯(並盛くらい)", "250g", 390],
        ["丼のご飯(やや多め)", "300g", 468],
        ["カレーライスのご飯(少なめ)", "200g", 312],
        ["カレーライスのご飯(標準)", "300g", 468],
      ],
    );
    assert.equal(RICE_NOTE, "ご飯は、50g減らすと約78kcal、100g減らすと約156kcal減ります。");
  });

  it("matches the bread portions and the slice savings", () => {
    assert.deepEqual(
      BREAD_ROWS.map((row) => [row.label, row.amount, row.kcal]),
      [
        ["食パン 4枚切", "約90g", 223],
        ["食パン 6枚切", "約60g", 149],
        ["食パン 8枚切", "約45g", 112],
        ["ロールパン 1個", "約30g", 93],
        ["バゲット 1切れ", "約30g", 87],
      ],
    );
    assert.equal(BREAD_NOTE, "4枚切を6枚切にすると約74kcal、6枚切を8枚切にすると約37kcal減ります。");
  });

  it("matches noodle regular, large, and the rounded increase", () => {
    assert.deepEqual(
      NOODLE_ROWS.map((row) => [
        row.label,
        row.regularGrams,
        row.regularKcal,
        row.largeGrams,
        row.largeKcal,
        row.deltaKcal,
      ]),
      [
        ["ラーメン(中華めん)", 230, 306, 345, 459, 153],
        ["うどん", 250, 238, 375, 356, 119],
        ["そば", 200, 260, 300, 390, 130],
        ["パスタ", 240, 360, 360, 540, 180],
      ],
    );
    assert.equal(PASTA_NOTE, "パスタ240gは、乾麺100gをゆでた量の目安です。");
  });

  it("matches the other staples", () => {
    const brown = OTHER_ROWS[0];
    assert.equal(brown?.kcal, 228);
    assert.equal(brown?.note, "白米150gは234kcal");
    assert.equal(OTHER_ROWS[1]?.kcal, 112);
    assert.equal(OTHER_ROWS[2]?.kcal, 170);
    assert.equal(otherKcalLabel(OTHER_ROWS[3]!), "257〜386");
    assert.equal(OTHER_ROWS[4]?.kcal, 285);
  });
});
