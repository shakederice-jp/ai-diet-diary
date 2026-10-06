import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMonthTrend } from "./month-trend";
import {
  chooseWeightAxisTicks,
  hasWeightOutsideRange,
  isWeightOutsideRange,
  parseWeightAxisFields,
  weightPlotFraction,
} from "./weight-axis";

const goal = {
  currentWeightKg: 70,
  targetWeightKg: 60,
  weeklyKcal: 14000,
};

describe("parseWeightAxisFields", () => {
  it("treats both blanks as automatic", () => {
    assert.deepEqual(parseWeightAxisFields("  ", ""), { ok: true, range: null });
  });

  it("rejects only one side", () => {
    const parsed = parseWeightAxisFields("60", "");
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.match(parsed.message, /両方/);
    }
  });

  it("accepts one decimal place and normalizes fullwidth numbers", () => {
    assert.deepEqual(parseWeightAxisFields("６２．５", "70"), {
      ok: true,
      range: { minKg: 62.5, maxKg: 70 },
    });
    assert.deepEqual(parseWeightAxisFields("60,0", "62.5"), {
      ok: true,
      range: { minKg: 60, maxKg: 62.5 },
    });
  });

  it("rejects a second decimal place, a reversed range, a narrow gap, and values outside 20–300", () => {
    assert.equal(parseWeightAxisFields("62.55", "70").ok, false);
    const reversed = parseWeightAxisFields("70", "60");
    assert.equal(reversed.ok, false);
    if (!reversed.ok) {
      assert.match(reversed.message, /下限より大きい/);
    }
    const narrow = parseWeightAxisFields("60", "61.9");
    assert.equal(narrow.ok, false);
    if (!narrow.ok) {
      assert.match(narrow.message, /2kg以上/);
    }
    assert.equal(parseWeightAxisFields("19.9", "30").ok, false);
    assert.equal(parseWeightAxisFields("20", "300").ok, true);
  });
});

describe("chooseWeightAxisTicks", () => {
  it("uses a readable step and about 4 to 6 labels", () => {
    assert.deepEqual(chooseWeightAxisTicks(60, 70), [60, 62, 64, 66, 68, 70]);
    assert.deepEqual(chooseWeightAxisTicks(60, 62), [60, 60.5, 61, 61.5, 62]);
    assert.deepEqual(chooseWeightAxisTicks(60, 80), [60, 65, 70, 75, 80]);
    assert.deepEqual(chooseWeightAxisTicks(62.5, 70), [64, 66, 68, 70]);
    const wide = chooseWeightAxisTicks(20, 300);
    assert.ok(wide.length >= 4 && wide.length <= 6, wide.join(", "));

    for (let min = 20; min <= 80; min += 0.5) {
      for (let span = 2; span <= 40; span += 0.5) {
        const max = Math.round((min + span) * 10) / 10;
        const ticks = chooseWeightAxisTicks(min, max);
        assert.ok(
          ticks.length >= 3 && ticks.length <= 7,
          `${min}–${max} => ${ticks.join(", ")}`,
        );
        for (const tick of ticks) {
          assert.ok(tick >= min - 1e-6 && tick <= max + 1e-6);
        }
        if (ticks.length >= 2) {
          const step = Math.round((ticks[1] - ticks[0]) * 10) / 10;
          assert.ok([0.5, 1, 2, 2.5, 5, 10, 20, 50, 100].includes(step));
          for (let index = 2; index < ticks.length; index += 1) {
            assert.equal(Math.round((ticks[index] - ticks[index - 1]) * 10) / 10, step);
          }
        }
      }
    }
  });
});

describe("out of range", () => {
  it("flags days outside the chosen edges and keeps the boundary inside", () => {
    assert.equal(isWeightOutsideRange(59.9, 60, 70), true);
    assert.equal(isWeightOutsideRange(70.1, 60, 70), true);
    assert.equal(isWeightOutsideRange(60, 60, 70), false);
    assert.equal(isWeightOutsideRange(70, 60, 70), false);
    assert.equal(hasWeightOutsideRange([65, 72], 60, 70), true);
    assert.equal(hasWeightOutsideRange([60, 70], 60, 70), false);
    assert.ok(weightPlotFraction(72, 60, 70) > 1);
    assert.ok(weightPlotFraction(58, 60, 70) < 0);
    assert.ok(weightPlotFraction(65, 60, 70) > 0 && weightPlotFraction(65, 60, 70) < 1);
  });
});

describe("buildMonthTrend", () => {
  const input = {
    year: 2026,
    month: 10,
    calories: [{ date: "2026-10-01", totalKcal: 1500 }],
    weights: [
      { date: "2026-10-01", weightKg: 65 },
      { date: "2026-10-02", weightKg: 72 },
    ],
    goal,
    today: "2026-10-06",
  };

  it("keeps the automatic weight scale and the calorie scale", () => {
    const model = buildMonthTrend(input);
    assert.equal(model.weight?.min, 55);
    assert.equal(model.weight?.max, 75);
    assert.equal(model.weight?.goal, 60);
    assert.equal(model.weightOutside, false);
    assert.ok(model.calories);

    const custom = buildMonthTrend({ ...input, axis: { minKg: 60, maxKg: 70 } });
    assert.deepEqual(custom.calories, model.calories);
    assert.deepEqual(
      custom.days.map((day) => day.kcal),
      model.days.map((day) => day.kcal),
    );
  });

  it("uses the saved range, clips the scale, and hides a goal outside it", () => {
    const model = buildMonthTrend({ ...input, axis: { minKg: 60, maxKg: 70 } });
    assert.equal(model.weight?.min, 60);
    assert.equal(model.weight?.max, 70);
    assert.equal(model.weight?.goal, 60);
    assert.equal(model.weightOutside, true);
    assert.ok(model.weight && model.weight.ticks.length >= 4 && model.weight.ticks.length <= 6);

    const hiddenGoal = buildMonthTrend({
      ...input,
      goal: { ...goal, targetWeightKg: 58 },
      axis: { minKg: 60, maxKg: 70 },
    });
    assert.equal(hiddenGoal.weight?.goal, null);
    assert.equal(hiddenGoal.weightOutside, true);
  });
});
