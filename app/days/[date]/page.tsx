import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { FavoriteMenuToggle } from "@/components/favorite-menu-toggle";
import { MealEntryForm } from "@/components/meal-entry-form";
import {
  createCategory,
  updateCategoryName,
  updateFavoriteCategory,
} from "@/app/days/[date]/actions";
import {
  WEEK_START_COOKIE,
  formatJapaneseDate,
  formatKcal,
  formatMonthParam,
  parseIsoDate,
  parseWeekStart,
} from "@/lib/calendar";
import { getWeeklyCalorieGoal } from "@/lib/goals";
import { loadDayScreen, type FavoriteMenu, type MenuCategory } from "@/lib/meals";
import { readUserIdFromCookies } from "@/lib/session";

const kcalFigure = "font-mono tabular-nums slashed-zero";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsed = parseIsoDate(date);
  if (!parsed) {
    notFound();
  }

  const store = await cookies();
  const weekStartsOn = parseWeekStart(store.get(WEEK_START_COOKIE)?.value);
  const userId = await readUserIdFromCookies();

  let loadError: string | null = null;
  let dayTotal = 0;
  let weekTotal = 0;
  let meals: Awaited<ReturnType<typeof loadDayScreen>>["meals"] = [];
  let categories: MenuCategory[] = [];
  let favorites: FavoriteMenu[] = [];
  const goal = await getWeeklyCalorieGoal(userId ?? "local");

  if (userId) {
    try {
      const screen = await loadDayScreen(userId, parsed.date, weekStartsOn);
      dayTotal = screen.dayTotal;
      weekTotal = screen.weekTotal;
      meals = screen.meals;
      categories = screen.categories;
      favorites = screen.favorites;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      loadError = /meal_records|menu_categories|favorite_menus/.test(message)
        ? "食事記録のテーブルがありません。マイグレーションを適用してください。"
        : "食事記録を読み込めませんでした。";
    }
  }

  const percent = goal > 0 ? Math.round((weekTotal / goal) * 100) : 0;
  const barWidth = Math.min(100, Math.max(0, percent));
  const loggedFavoriteIds = new Set(
    meals.flatMap((meal) => (meal.favoriteId ? [meal.favoriteId] : [])),
  );

  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF8F3] px-4 py-10 dark:bg-black">
      <main className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-sm sm:p-8 dark:bg-zinc-950">
        <Link
          href={`/?month=${formatMonthParam(parsed.year, parsed.month)}`}
          className="text-sm font-medium text-[#F5821F]"
        >
          カレンダーに戻る
        </Link>
        <p className="mt-4 text-sm font-medium text-[#F5821F]">食事記録</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {formatJapaneseDate(parsed.date)}
        </h1>

        <section className="mt-6 rounded-2xl bg-[#FFF4EB] p-5">
          <p className="text-sm text-zinc-600">この日の合計</p>
          <p className={`mt-1 text-4xl font-semibold text-[#F5821F] ${kcalFigure}`}>
            {formatKcal(dayTotal)}
          </p>
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 text-sm text-zinc-700">
              <span>今週の目標</span>
              <span className={kcalFigure}>
                {formatKcal(weekTotal)} / {formatKcal(goal)}
              </span>
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-white"
              role="progressbar"
              aria-label="週の目標に対する進捗"
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={weekTotal}
            >
              <div
                className="h-full rounded-full bg-[#F5821F]"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <p className={`mt-2 text-right text-xs text-[#F5821F] ${kcalFigure}`}>
              {percent}%
            </p>
          </div>
        </section>

        {loadError ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </p>
        ) : null}

        <MealEntryForm date={parsed.date} />

        <section className="mt-8">
          <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            この日の記録
          </h2>
          {meals.length > 0 ? (
            <ul className="mt-3 divide-y divide-[#F5821F]/20">
              {meals.map((meal) => (
                <li key={meal.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{meal.name}</span>
                  <span className={`font-medium text-[#F5821F] ${kcalFigure}`}>
                    {formatKcal(meal.kcal)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              まだ記録がありません。
            </p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            よく使うメニュー
          </h2>
          <form action={createCategory} className="mt-3 flex gap-2">
            <input type="hidden" name="date" value={parsed.date} />
            <input
              name="name"
              maxLength={20}
              placeholder="カテゴリーを追加"
              aria-label="新しいカテゴリー名"
              className="h-10 flex-1 rounded-xl border border-[#F5821F]/40 px-3 text-sm outline-none focus:border-[#F5821F]"
            />
            <button
              type="submit"
              className="h-10 rounded-full border border-[#F5821F] px-4 text-sm font-medium text-[#F5821F]"
            >
              追加
            </button>
          </form>

          {categories.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              料理を登録すると、和食や麺類などのカテゴリーに分類されます。
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {categories.map((category) => {
                const items = favorites.filter((favorite) => favorite.categoryId === category.id);
                return (
                  <div key={category.id}>
                    <form action={updateCategoryName} className="flex items-center gap-2">
                      <input type="hidden" name="date" value={parsed.date} />
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input
                        name="name"
                        defaultValue={category.name}
                        maxLength={20}
                        aria-label={`${category.name}のカテゴリー名`}
                        className="h-9 w-40 rounded-lg border border-[#F5821F]/40 px-2 text-sm font-medium text-[#F5821F] outline-none focus:border-[#F5821F]"
                      />
                      <button type="submit" className="text-sm text-[#F5821F]">
                        変更
                      </button>
                    </form>
                    {items.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {items.map((favorite) => (
                          <li key={favorite.id} className="flex flex-wrap items-center gap-3">
                            <FavoriteMenuToggle
                              date={parsed.date}
                              favoriteId={favorite.id}
                              checked={loggedFavoriteIds.has(favorite.id)}
                              label={`${favorite.name} ${formatKcal(favorite.kcal)}`}
                            />
                            <form action={updateFavoriteCategory} className="flex items-center gap-2">
                              <input type="hidden" name="date" value={parsed.date} />
                              <input type="hidden" name="favoriteId" value={favorite.id} />
                              <select
                                name="categoryId"
                                defaultValue={favorite.categoryId}
                                aria-label={`${favorite.name}のカテゴリー`}
                                className="h-8 rounded-lg border border-[#F5821F]/40 bg-white px-2 text-xs"
                              >
                                {categories.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                              <button type="submit" className="text-xs text-[#F5821F]">
                                移動
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-500">メニューはまだありません。</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
