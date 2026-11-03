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
  it("uses the saved minimum, midpoint, and maximum as the three labels", () => {
    assert.deepEqual(chooseWeightAxisTicks(60, 70), [60, 65, 70]);
    assert.deepEqual(chooseWeightAxisTicks(60, 62), [60, 61, 62]);
    assert.deepEqual(chooseWeightAxisTicks(60, 80), [60, 70, 80]);
    assert.deepEqual(chooseWeightAxisTicks(62.5, 70), [62.5, 66.3, 70]);
    assert.deepEqual(chooseWeightAxisTicks(65, 70), [65, 67.5, 70]);
    assert.deepEqual(chooseWeightAxisTicks(20, 300), [20, 160, 300]);

    for (let min = 20; min <= 80; min += 0.5) {
      for (let span = 2; span <= 40; span += 0.5) {
        const max = Math.round((min + span) * 10) / 10;
        const ticks = chooseWeightAxisTicks(min, max);
        assert.equal(ticks.length, 3, `${min}–${max} => ${ticks.join(", ")}`);
        assert.equal(ticks[0], min);
        assert.equal(ticks[2], max);
        assert.equal(ticks[1], Math.round(((min + max) / 2) * 10) / 10);
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
    assert.equal(model.weight?.min, 59);
    assert.equal(model.weight?.max, 81);
    assert.deepEqual(model.weight?.ticks, [60, 70, 80]);
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
    assert.deepEqual(model.weight?.ticks, [60, 65, 70]);

    const hiddenGoal = buildMonthTrend({
      ...input,
      goal: { ...goal, targetWeightKg: 58 },
      axis: { minKg: 60, maxKg: 70 },
    });
    assert.equal(hiddenGoal.weight?.goal, null);
    assert.equal(hiddenGoal.weightOutside, true);
  });
});
