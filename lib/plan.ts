export type HistoryUser = { id: string };

/**
 * いまは全員、見られる期間に制限はない（null）。
 * 将来、無料プランでは画面で見られる過去を限ることがある。
 * そのときも、保存している記録は消さず、薄くもしない。
 */
export function getHistoryLimit(user: HistoryUser | null): number | null {
  void user;
  return null;
}

export function canViewMonth(user: HistoryUser | null, yyyyMm: string): boolean {
  if (!user?.id) {
    return false;
  }
  if (!/^\d{4}-\d{2}$/.test(yyyyMm)) {
    return false;
  }
  const limit = getHistoryLimit(user);
  if (limit == null) {
    return true;
  }
  return true;
}
