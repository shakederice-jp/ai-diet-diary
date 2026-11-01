import assert from "node:assert/strict";
import test from "node:test";
import { canViewMonth, getHistoryLimit } from "./plan";

test("history stays unlimited for every user", () => {
  assert.equal(getHistoryLimit(null), null);
  assert.equal(getHistoryLimit({ id: "user-1" }), null);
  assert.equal(canViewMonth({ id: "user-1" }, "2026-10"), true);
  assert.equal(canViewMonth(null, "2026-10"), false);
  assert.equal(canViewMonth({ id: "user-1" }, "2026-10-01"), false);
});
