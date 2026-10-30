import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EATING_OUT_DISHES,
  EATING_OUT_GENRES,
  calorieMark,
  filterEatingOutDishes,
  isBalancedDish,
  proteinMark,
  vegetableMark,
} from "./eating-out-guide";

function dishNamed(name: string) {
  const dish = EATING_OUT_DISHES.find((item) => item.name === name);
  assert.ok(dish, name);
  return dish;
}

describe("eating out guide data", () => {
  it("keeps 74 dishes in the original genre order", () => {
    assert.equal(EATING_OUT_DISHES.length, 74);
    assert.deepEqual(
      EATING_OUT_GENRES.map((genre) => EATING_OUT_DISHES.filter((dish) => dish.genre === genre).length),
      [10, 8, 10, 11, 12, 7, 8, 8],
    );
    assert.equal(new Set(EATING_OUT_DISHES.map((dish) => dish.name)).size, 74);
  });

  it("keeps official flags and notes on the published rows", () => {
    const gyudon = dishNamed("牛丼");
    assert.deepEqual(gyudon.calorie, [630, 710]);
    assert.equal(gyudon.proteinOfficial, true);
    assert.equal(gyudon.vegetableOfficial, false);
    const chanpon = dishNamed("ちゃんぽん");
    assert.equal(chanpon.proteinOfficial, true);
    assert.equal(chanpon.vegetableOfficial, true);
    assert.deepEqual(chanpon.vegetable, [150, 255]);
    assert.equal(dishNamed("きつねうどん").note, "小〜中サイズの幅");
    assert.match(dishNamed("幕の内弁当").note, /730kcal/);
    assert.equal(dishNamed("ハンバーグ弁当").note, "");
    assert.equal(dishNamed("ガパオライス").proteinOfficial, true);
  });
});

describe("eating out marks", () => {
  it("uses the midpoint boundaries", () => {
    assert.equal(calorieMark([650, 650]), "◎");
    assert.equal(calorieMark([651, 651]), "○");
    assert.equal(calorieMark([850, 850]), "○");
    assert.equal(calorieMark([851, 851]), "△");
    assert.equal(proteinMark([30, 30]), "◎");
    assert.equal(proteinMark([20, 20]), "○");
    assert.equal(proteinMark([19, 19]), "△");
    assert.equal(vegetableMark([120, 120]), "◎");
    assert.equal(vegetableMark([70, 70]), "○");
    assert.equal(vegetableMark([69, 69]), "△");
  });

  it("marks a dish balanced only when none of the three is low-or-high", () => {
    assert.equal(isBalancedDish(dishNamed("焼き魚定食")), true);
    assert.equal(isBalancedDish(dishNamed("唐揚げ定食")), false);
    assert.equal(isBalancedDish(dishNamed("ざるそば")), false);
    const bento = filterEatingOutDishes(EATING_OUT_DISHES, {
      genre: "弁当",
      balancedOnly: true,
      sort: "standard",
    });
    assert.equal(bento.length, 0);
  });

  it("sorts by the midpoint and keeps the original order for ties", () => {
    const byCalorie = filterEatingOutDishes(EATING_OUT_DISHES, {
      genre: "すべて",
      balancedOnly: false,
      sort: "calorie",
    });
    assert.equal(byCalorie[0]?.name, "サンドイッチ(ミックスサンド)");
    const byProtein = filterEatingOutDishes(EATING_OUT_DISHES, {
      genre: "すべて",
      balancedOnly: false,
      sort: "protein",
    });
    assert.equal(byProtein[0]?.name, "ミックスグリル");
    const byVegetable = filterEatingOutDishes(EATING_OUT_DISHES, {
      genre: "すべて",
      balancedOnly: false,
      sort: "vegetable",
    });
    assert.equal(byVegetable[0]?.name, "肉野菜炒め定食");
    const standard = filterEatingOutDishes(EATING_OUT_DISHES, {
      genre: "すべて",
      balancedOnly: false,
      sort: "standard",
    });
    assert.equal(standard[0]?.name, "焼き魚定食");
    assert.equal(standard.at(-1)?.name, "ガパオライス");
  });
});
