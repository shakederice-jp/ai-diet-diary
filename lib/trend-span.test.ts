import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMonthCalendar, weekBounds } from "./calendar";
import { calorieScale, periodCalorieScale, periodWeightScale } from "./month-trend";
import { buildMonthSpan, buildWeekSpan, weekWindow } from "./trend-span";

const today = "2026-11-01";

describe("week span", () => {
  it("puts the current week on the right and averages one week", () => {
    const model = buildWeekSpan({
      today,
      page: 0,
      weekStartsOn: "sunday",
      earliest: "2026-04-01",
      weeklyKcal: 14000,
      calories: [
        { date: "2026-11-01", totalKcal: 500 },
        { date: "2026-11-02", totalKcal: 700 },
        { date: "2026-10-25", totalKcal: 1000 },
      ],
      weights: [
        { date: "2026-11-01", weightKg: 60 },
        { date: "2026-11-02", weightKg: 61 },
      ],
    });

    assert.equal(model.points.length, 28);
    const current = weekBounds(today, "sunday");
    const last = model.points[27];
    assert.equal(last.key, current.start);
    assert.equal(last.partial, true);
    assert.equal(last.kcal, 1200);
    assert.equal(last.recordedDays, 2);
    assert.equal(last.weightKg, 60.5);
    assert.equal(last.detailTitle, "11/1〜11/7");
    assert.equal(last.axisLabel, "11/1");
    assert.equal(model.points[0].axisLabel, null);
    assert.equal(model.points[26].kcal, 1000);
    assert.equal(model.points[0].kcal, null);
    assert.equal(model.points[0].weightKg, null);
    assert.equal(weekWindow(today, 0, "sunday")[27].start, current.start);
    assert.equal(model.limitLabel, "上限");
    assert.equal(model.calories?.goal, 14000);
    assert.match(model.summary, /^直近28週の平均: /);
  });

  it("stops before the oldest record", () => {
    const model = buildWeekSpan({
      today,
      page: 9,
      weekStartsOn: "sunday",
      earliest: today,
      weeklyKcal: null,
      calories: [],
      weights: [],
    });
    assert.equal(model.page, 0);
    assert.equal(model.maxPage, 0);
  });
});

describe("month span", () => {
  it("matches the calendar month average and excludes today", () => {
    const calories = [
      { date: "2026-11-01", totalKcal: 999 },
      { date: "2026-11-02", totalKcal: 400 },
      { date: "2026-11-03", totalKcal: 200 },
      { date: "2026-10-01", totalKcal: 100 },
      { date: "2026-10-02", totalKcal: 300 },
    ];
    const model = buildMonthSpan({
      today,
      page: 0,
      weekStartsOn: "sunday",
      earliest: "2025-01-01",
      weeklyKcal: 14000,
      calories,
      weights: [
        { date: "2026-11-02", weightKg: 70 },
        { date: "2026-11-03", weightKg: 72 },
      ],
    });
    const november = model.points.find((point) => point.key === "2026-11");
    const october = model.points.find((point) => point.key === "2026-10");
    const empty = model.points.find((point) => point.key === "2025-12");
    const calendar = buildMonthCalendar({
      year: 2026,
      month: 11,
      weekStartsOn: "sunday",
      records: calories,
      today: { year: 2026, month: 11, date: today },
    });

    assert.equal(model.points.length, 12);
    assert.equal(model.points[11].key, "2026-11");
    assert.equal(november?.partial, true);
    assert.equal(november?.kcal, calendar.averageKcal);
    assert.equal(november?.kcal, 300);
    assert.equal(november?.recordedDays, 2);
    assert.equal(november?.weightKg, 71);
    assert.equal(november?.detailTitle, "2026年11月");
    assert.equal(october?.partial, false);
    assert.equal(october?.kcal, 200);
    assert.equal(october?.recordedDays, 2);
    assert.equal(empty?.kcal, null);
    assert.equal(empty?.weightKg, null);
    assert.equal(model.points.find((point) => point.key === "2026-01")?.yearLabel, "2026");
    assert.equal(model.limitLabel, "1日の上限");
    assert.equal(model.calories?.goal, 2000);
    assert.match(model.summary, /^直近12か月の平均: /);
  });

  it("clamps paging to the oldest month", () => {
    const model = buildMonthSpan({
      today,
      page: 9,
      weekStartsOn: "monday",
      earliest: "2024-11-01",
      weeklyKcal: null,
      calories: [],
      weights: [],
    });
    assert.equal(model.maxPage, 2);
    assert.equal(model.page, 2);
    assert.equal(model.points[11].key, "2024-11");
  });
});

describe("period scales", () => {
  it("keeps the daily calorie window and widens only the period view", () => {
    const daily = calorieScale(2000, [100]);
    assert.equal(daily?.min, 1200);
    const widened = periodCalorieScale(2000, [100]);
    assert.equal(widened?.min, 100);
    assert.equal(widened?.goal, 2000);
    const inside = periodCalorieScale(2000, [1800]);
    assert.equal(inside?.min, calorieScale(2000, [1800])?.min);
  });

  it("uses an integer weight range at least 3kg wide", () => {
    const tight = periodWeightScale([60]);
    assert.ok(tight);
    assert.equal(tight.min, Math.floor(tight.min));
    assert.equal(tight.max, Math.ceil(tight.max));
    assert.ok(tight.max - tight.min >= 3);
    assert.equal(tight.goal, null);
  });
});
