import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMonthCalendar, weekBounds } from "./calendar";
import { buildMonthTrend, calorieScale, periodCalorieScale, periodWeightScale, sharedWeightScale } from "./month-trend";
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
  it("uses three calorie ticks and keeps the limit inside them", () => {
    const daily = calorieScale(2000, [100]);
    assert.deepEqual(daily?.ticks, [0, 1000, 2000]);
    assert.equal(daily?.ticks.length, 3);
    assert.ok(daily && daily.min < daily.ticks[0] + 1e-6);
    assert.ok(daily && daily.max > daily.ticks[2] - 1e-6);
    const widened = periodCalorieScale(2000, [100]);
    assert.deepEqual(widened?.ticks, daily?.ticks);
    assert.equal(widened?.goal, 2000);
    const inside = periodCalorieScale(2000, [1800]);
    assert.equal(inside?.min, calorieScale(2000, [1800])?.min);
    assert.equal(inside?.ticks.length, 3);
    const week = calorieScale(14000, [11000]);
    assert.deepEqual(week?.ticks, [10000, 12000, 14000]);
    assert.equal(week?.ticks.length, 3);
  });

  it("uses three weight ticks around a single point", () => {
    const tight = periodWeightScale([60]);
    assert.ok(tight);
    assert.equal(tight.ticks.length, 3);
    assert.ok(tight.min < 60 && tight.max > 60);
    assert.equal(tight.goal, null);
    const spread = periodWeightScale([62.4, 63.6]);
    assert.deepEqual(spread?.ticks, [62, 63, 64]);
  });

  it("uses the same weight axis on the day, week, and month charts", () => {
    const scale = sharedWeightScale({ minKg: 66.2, maxKg: 68.4 }, { minKg: 65, maxKg: 70 });
    assert.ok(scale);
    assert.equal(scale.min, 65);
    assert.equal(scale.max, 70);
    assert.deepEqual(scale.ticks, [65, 67.5, 70]);
    const fromData = sharedWeightScale({ minKg: 66.2, maxKg: 68.4 }, null);
    assert.deepEqual(fromData?.ticks, [66, 68, 70]);
    assert.ok(fromData && fromData.min < 66.2 && fromData.max > 68.4);

    const day = buildMonthTrend({
      year: 2026,
      month: 11,
      calories: [{ date: "2026-11-01", totalKcal: 1500 }],
      weights: [{ date: "2026-11-01", weightKg: 67.2 }],
      goal: null,
      today: "2026-11-03",
      weightScale: scale,
    });
    const week = buildWeekSpan({
      today,
      page: 0,
      weekStartsOn: "sunday",
      earliest: "2026-04-01",
      weeklyKcal: 14000,
      calories: [{ date: "2026-11-01", totalKcal: 1500 }],
      weights: [{ date: "2026-11-01", weightKg: 67.2 }],
      weightScale: scale,
    });
    const month = buildMonthSpan({
      today,
      page: 0,
      weekStartsOn: "sunday",
      earliest: "2026-04-01",
      weeklyKcal: 14000,
      calories: [{ date: "2026-11-01", totalKcal: 1500 }],
      weights: [{ date: "2026-11-01", weightKg: 67.2 }],
      weightScale: scale,
    });
    const laterWeek = buildWeekSpan({
      today,
      page: 1,
      weekStartsOn: "sunday",
      earliest: "2026-04-01",
      weeklyKcal: 14000,
      calories: [{ date: "2026-04-06", totalKcal: 900 }],
      weights: [{ date: "2026-04-06", weightKg: 80 }],
      weightScale: scale,
    });

    assert.deepEqual(day.weight?.ticks, scale.ticks);
    assert.deepEqual(week.weight?.ticks, scale.ticks);
    assert.deepEqual(month.weight?.ticks, scale.ticks);
    assert.deepEqual(laterWeek.weight?.ticks, scale.ticks);
    assert.equal(day.weight?.min, scale.min);
    assert.equal(week.weight?.max, scale.max);
    assert.equal(month.weight?.min, scale.min);
    assert.equal(week.calories?.ticks.length, 3);
    assert.equal(month.calories?.ticks.length, 3);
    assert.notDeepEqual(week.calories?.ticks, month.calories?.ticks);
  });
});
