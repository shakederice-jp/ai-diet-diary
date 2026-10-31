import { parseManualKcal } from "./manual-kcal";

export const BULK_MEAL_LINE_LIMIT = 30;
export const BULK_MEAL_LINE_MAX_LENGTH = 100;
export const MANUAL_KCAL_ERROR = "カロリーは0〜10000の整数で入力してください。";

export type DraftMealRow = {
  key: string;
  name: string;
  kcal: string;
};

export type BulkKcalLine = {
  name: string;
  manualKcal: number | null;
};

export function normalizeBulkLine(line: string) {
  return line.trim().replace(/\s+/g, " ");
}

export function parseBulkLines(text: string) {
  return text
    .split(/\r?\n/)
    .map(normalizeBulkLine)
    .filter((line) => line.length > 0);
}

export function appendVoiceLine(current: string, addition: string) {
  const next = normalizeBulkLine(addition);
  if (!next) {
    return current;
  }
  if (!current.trim()) {
    return next;
  }
  return `${current.replace(/\s+$/, "")}\n${next}`;
}

export function bulkLineProblem(lines: string[]) {
  if (lines.length === 0) {
    return "料理名を入力してください。";
  }
  if (lines.length > BULK_MEAL_LINE_LIMIT) {
    return "一度に登録できるのは30品までです。分けて登録してください。";
  }
  if (lines.some((line) => line.length > BULK_MEAL_LINE_MAX_LENGTH)) {
    return "1行は100文字までです。";
  }
  return null;
}

export function blankMealRow(key: string): DraftMealRow {
  return { key, name: "", kcal: "" };
}

export function draftRowName(row: DraftMealRow) {
  return normalizeBulkLine(row.name);
}

export function namedDraftCount(rows: DraftMealRow[]) {
  return rows.filter((row) => draftRowName(row).length > 0).length;
}

export function pastedMealNames(text: string) {
  if (!/[\r\n]/.test(text)) {
    return null;
  }
  return parseBulkLines(text);
}

export function applyMultilinePaste(input: {
  rows: DraftMealRow[];
  index: number;
  lines: string[];
  namedElsewhere: number;
  keys: string[];
}): { rows: DraftMealRow[]; focusKey: string } {
  const current = input.rows[input.index];
  if (!current || input.lines.length === 0) {
    return { rows: input.rows, focusKey: current?.key ?? "" };
  }
  const before = input.rows.slice(0, input.index);
  const after = input.rows.slice(input.index + 1);
  const room = BULK_MEAL_LINE_LIMIT - input.namedElsewhere - namedDraftCount(before) - namedDraftCount(after);
  const accepted = room > 0 ? input.lines.slice(0, room) : [];
  if (accepted.length === 0) {
    return { rows: input.rows, focusKey: current.key };
  }
  const [first, ...rest] = accepted;
  const inserted: DraftMealRow[] = [
    { ...current, name: first ?? "" },
    ...rest.map((name, offset) => ({
      key: input.keys[offset] ?? `${current.key}-paste-${offset}`,
      name,
      kcal: "",
    })),
  ];
  return {
    rows: [...before, ...inserted, ...after],
    focusKey: inserted[inserted.length - 1]?.key ?? current.key,
  };
}

export function insertRowBelow(rows: DraftMealRow[], index: number, key: string) {
  const last = rows[rows.length - 1];
  if (!last || draftRowName(last).length === 0) {
    return null;
  }
  const next = rows.slice();
  next.splice(index + 1, 0, blankMealRow(key));
  return next;
}

export function appendDraftRow(rows: DraftMealRow[], key: string) {
  if (rows.length >= BULK_MEAL_LINE_LIMIT) {
    return rows;
  }
  return [...rows, blankMealRow(key)];
}

export function removeDraftRow(rows: DraftMealRow[], key: string, blankKey: string) {
  const next = rows.filter((row) => row.key !== key);
  if (next.length === 0) {
    return [blankMealRow(blankKey)];
  }
  return next;
}

export function placeVoiceName(rows: DraftMealRow[], addition: string, key: string) {
  const name = normalizeBulkLine(addition);
  if (!name) {
    return rows;
  }
  const emptyIndex = rows.findIndex((row) => draftRowName(row).length === 0);
  if (emptyIndex >= 0) {
    return rows.map((row, index) => (index === emptyIndex ? { ...row, name } : row));
  }
  if (rows.length >= BULK_MEAL_LINE_LIMIT) {
    return rows;
  }
  return [...rows, { key, name, kcal: "" }];
}

export function draftKcalProblem(kcal: string) {
  return readDraftKcal(kcal).ok ? null : MANUAL_KCAL_ERROR;
}

export function readDraftKcal(kcal: string): { ok: true; kcal: number | null } | { ok: false } {
  const trimmed = kcal.trim();
  if (!trimmed) {
    return { ok: true, kcal: null };
  }
  const parsed = parseManualKcal(trimmed);
  if (parsed === null) {
    return { ok: false };
  }
  return { ok: true, kcal: parsed };
}

export async function fillBulkEstimates<T extends BulkKcalLine>(
  lines: T[],
  estimate: (names: string[]) => Promise<Array<number | null>>,
): Promise<Array<T & { kcal: number | null; kcalSource: "manual" | "ai" }>> {
  const names = lines.filter((line) => line.manualKcal === null).map((line) => line.name);
  const estimates = names.length === 0 ? [] : await estimate(names);
  let cursor = 0;
  return lines.map((line) => {
    if (line.manualKcal !== null) {
      return { ...line, kcal: line.manualKcal, kcalSource: "manual" as const };
    }
    const kcal = estimates[cursor] ?? null;
    cursor += 1;
    return { ...line, kcal, kcalSource: "ai" as const };
  });
}

export function speechInputAvailable(input: {
  hasApi: boolean;
  ios: boolean;
  standalone: boolean;
}) {
  if (!input.hasApi) {
    return false;
  }
  if (input.ios && input.standalone) {
    return false;
  }
  return true;
}
