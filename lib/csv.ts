export function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  const guarded = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function csvDocument(rows: Array<Array<string | number | null | undefined>>) {
  const body = rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\r\n");
  return `\uFEFF${body}\r\n`;
}
