export function parseManualKcal(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,5}$/.test(trimmed)) {
    return null;
  }
  const kcal = Number(trimmed);
  if (kcal > 10000) {
    return null;
  }
  return kcal;
}
