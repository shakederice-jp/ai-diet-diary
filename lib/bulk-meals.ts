export const BULK_MEAL_LINE_LIMIT = 30;
export const BULK_MEAL_LINE_MAX_LENGTH = 100;

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
