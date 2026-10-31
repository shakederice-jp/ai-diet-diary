import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyMultilinePaste,
  appendDraftRow,
  blankMealRow,
  draftKcalProblem,
  fillBulkEstimates,
  insertRowBelow,
  placeVoiceName,
} from "./bulk-meals";

describe("meal draft rows", () => {
  it("splits a multiline paste and drops lines past the 30-dish limit", () => {
    const rows = [blankMealRow("a")];
    const lines = Array.from({ length: 32 }, (_, index) => `品${index + 1}`);
    const applied = applyMultilinePaste({
      rows,
      index: 0,
      lines,
      namedElsewhere: 0,
      keys: lines.slice(1).map((_, index) => `k${index}`),
    });
    assert.equal(applied.rows.length, 30);
    assert.equal(applied.rows[0]?.name, "品1");
    assert.equal(applied.rows[29]?.name, "品30");
    assert.equal(applied.focusKey, applied.rows[29]?.key);
  });

  it("keeps the current row's kcal on the first pasted line", () => {
    const applied = applyMultilinePaste({
      rows: [{ key: "a", name: "既存", kcal: "120" }, blankMealRow("b")],
      index: 0,
      lines: ["ご飯", "味噌汁"],
      namedElsewhere: 0,
      keys: ["c"],
    });
    assert.deepEqual(
      applied.rows.map((row) => [row.name, row.kcal]),
      [
        ["ご飯", "120"],
        ["味噌汁", ""],
        ["", ""],
      ],
    );
  });

  it("does not add a row with Enter when the last row is empty", () => {
    const rows = [{ key: "a", name: "ご飯", kcal: "" }, blankMealRow("b")];
    assert.equal(insertRowBelow(rows, 0, "c"), null);
  });

  it("inserts the next row under the current name when the last row is filled", () => {
    const rows = [{ key: "a", name: "ご飯", kcal: "" }];
    const next = insertRowBelow(rows, 0, "b");
    assert.deepEqual(next?.map((row) => row.key), ["a", "b"]);
    assert.equal(next?.[1]?.name, "");
  });

  it("puts speech into the first empty name and appends when every row is filled", () => {
    const filled = placeVoiceName(
      [{ key: "a", name: "ご飯", kcal: "" }, blankMealRow("b")],
      "味噌汁",
      "c",
    );
    assert.equal(filled[1]?.name, "味噌汁");
    assert.equal(filled.length, 2);

    const appended = placeVoiceName([{ key: "a", name: "ご飯", kcal: "100" }], "味噌汁", "c");
    assert.equal(appended.length, 2);
    assert.equal(appended[1]?.name, "味噌汁");
    assert.equal(appended[1]?.kcal, "");
  });

  it("rejects kcal that are negative, not numbers, or above 10000", () => {
    assert.equal(draftKcalProblem(""), null);
    assert.equal(draftKcalProblem("0"), null);
    assert.equal(draftKcalProblem("10000"), null);
    assert.ok(draftKcalProblem("-1"));
    assert.ok(draftKcalProblem("abc"));
    assert.ok(draftKcalProblem("10001"));
  });

  it("asks AI only for rows without kcal, and skips the call when every row has one", async () => {
    let calls = 0;
    const manualOnly = await fillBulkEstimates(
      [
        { name: "手入力A", manualKcal: 1111 },
        { name: "手入力B", manualKcal: 2222 },
      ],
      async () => {
        calls += 1;
        return [];
      },
    );
    assert.equal(calls, 0);
    assert.deepEqual(
      manualOnly.map((line) => [line.kcal, line.kcalSource]),
      [
        [1111, "manual"],
        [2222, "manual"],
      ],
    );

    const mixed = await fillBulkEstimates(
      [
        { name: "手入力", manualKcal: 4321 },
        { name: "推定する品", manualKcal: null },
      ],
      async (names) => {
        calls += 1;
        assert.deepEqual(names, ["推定する品"]);
        return [350];
      },
    );
    assert.equal(calls, 1);
    assert.deepEqual(
      mixed.map((line) => [line.name, line.kcal, line.kcalSource]),
      [
        ["手入力", 4321, "manual"],
        ["推定する品", 350, "ai"],
      ],
    );
  });

  it("stops adding rows at 30 in one meal", () => {
    const rows = Array.from({ length: 30 }, (_, index) => blankMealRow(`k${index}`));
    assert.equal(appendDraftRow(rows, "extra"), rows);
  });
});
