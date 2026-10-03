import { Suspense } from "react";
import { AdvisorNote } from "@/components/advisor-note";
import { DailyCalorieBand } from "@/components/daily-calorie-band";
import { FavoriteMenuToggle } from "@/components/favorite-menu-toggle";
import { InstantLink } from "@/components/instant-link";
import { navSecondary } from "@/components/nav-styles";
import { MealRecordList } from "@/components/meal-record-list";
import { StepRecordPanel } from "@/components/step-record-panel";
import { SubmitButton } from "@/components/submit-button";
import { WeightRecordPanel } from "@/components/weight-record-panel";
import {
  createCategory,
  updateCategoryName,
  updateFavoriteCategory,
} from "@/app/days/[date]/actions";
import { loadAdvisorComment, type AdvisorCommentView } from "@/lib/advisor-comment";
import { formatKcal, type WeekStart } from "@/lib/calendar";
import { dailyCalorieGoalFromWeekly, getWeeklyCalorieGoal } from "@/lib/goals";
import { loadDayScreen, type FavoriteMenu, type MenuCategory } from "@/lib/meals";
import { listStepOnDate, type StepDayRecord } from "@/lib/steps";
import { dateTimeLocalOnPageDate, type WeightDayRecord } from "@/lib/weight-format";
import { listWeightsOnDate } from "@/lib/weights";

const kcalFigure = "font-mono tabular-nums slashed-zero";

type ScreenResult =
  | {
      ok: true;
      meals: Awaited<ReturnType<typeof loadDayScreen>>["meals"];
      categories: MenuCategory[];
      favorites: FavoriteMenu[];
      dayTotal: number;
      weekTotal: number;
    }
  | { ok: false; error: string };

function mealErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /meal_records|menu_categories|favorite_menus|meal_period|meal_source|kcal_source/.test(message)
    ? "食事記録のテーブルがありません。マイグレーションを適用してください。"
    : "食事記録を読み込めませんでした。";
}

function weightErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /weight_records/.test(message)
    ? "体重のテーブルがありません。マイグレーションを適用してください。"
    : "体重を読み込めませんでした。";
}

function stepErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /step_records/.test(message)
    ? "歩数のテーブルがありません。マイグレーションを適用してください。"
    : "歩数を読み込めませんでした。";
}

async function DayComment({
  commentPromise,
}: {
  commentPromise: Promise<AdvisorCommentView | null>;
}) {
  const view = await commentPromise;
  if (!view) {
    return null;
  }
  return <AdvisorNote view={view} />;
}

export async function DayBody({
  userId,
  date,
  weekStartsOn,
}: {
  userId: string;
  date: string;
  weekStartsOn: WeekStart;
}) {
  const goalPromise = getWeeklyCalorieGoal(userId);
  const screenPromise: Promise<ScreenResult> = loadDayScreen(userId, date, weekStartsOn).then(
    (screen) => ({ ok: true as const, ...screen }),
    (error: unknown) => ({ ok: false as const, error: mealErrorMessage(error) }),
  );
  const weightsPromise: Promise<{ records: WeightDayRecord[]; error: string | null }> =
    listWeightsOnDate(userId, date).then(
      (records) => ({ records, error: null }),
      (error: unknown) => ({ records: [], error: weightErrorMessage(error) }),
    );
  const stepsPromise: Promise<{ record: StepDayRecord | null; error: string | null }> =
    listStepOnDate(userId, date).then(
      (record) => ({ record, error: null }),
      (error: unknown) => ({ record: null, error: stepErrorMessage(error) }),
    );
  const commentPromise: Promise<AdvisorCommentView | null> = Promise.all([
    screenPromise,
    goalPromise,
  ]).then(async ([screen, goal]) => {
    if (!screen.ok) {
      return null;
    }
    return loadAdvisorComment({
      userId,
      date,
      meals: screen.meals,
      dailyGoal: dailyCalorieGoalFromWeekly(goal),
    });
  });

  const [goal, screen, weights, steps] = await Promise.all([
    goalPromise,
    screenPromise,
    weightsPromise,
    stepsPromise,
  ]);
  const dayTotal = screen.ok ? screen.dayTotal : 0;
  const weekTotal = screen.ok ? screen.weekTotal : 0;
  const meals = screen.ok ? screen.meals : [];
  const categories = screen.ok ? screen.categories : [];
  const favorites = screen.ok ? screen.favorites : [];
  const percent = goal > 0 ? Math.round((weekTotal / goal) * 100) : 0;
  const barWidth = Math.min(100, Math.max(0, percent));
  const loggedFavoriteIds = new Set(
    meals.flatMap((meal) => (meal.favoriteId ? [meal.favoriteId] : [])),
  );

  return (
    <>
      <section className="mt-6 rounded-2xl bg-[#E7DCC8] p-5">
        <p className="text-sm text-zinc-600">この日の合計</p>
        <p className={`mt-1 text-4xl font-semibold text-[#F5821F] ${kcalFigure}`}>
          {formatKcal(dayTotal)}
        </p>
        <div className="mt-5">
          <div className="flex flex-col gap-3 text-base text-zinc-700">
            <span className="flex items-center justify-between gap-3">
              <span>今週の目標</span>
              <span className={kcalFigure}>
                {formatKcal(weekTotal)} / {formatKcal(goal)}
              </span>
            </span>
            <InstantLink href="/goals" className={navSecondary}>
              変更
            </InstantLink>
          </div>
          <div
            className="mt-2 h-3 overflow-hidden rounded-full bg-white"
            role="progressbar"
            aria-label="週の目標に対する進捗"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={weekTotal}
          >
            <div className="h-full rounded-full bg-[#F5821F]" style={{ width: `${barWidth}%` }} />
          </div>
          <p className={`mt-2 text-right text-xs text-[#F5821F] ${kcalFigure}`}>{percent}%</p>
        </div>
      </section>

      {screen.ok ? null : (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{screen.error}</p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">この日の記録</h2>
        {screen.ok ? (
          <>
            <Suspense
              fallback={
                <p className="mt-4 rounded-2xl bg-[#E7DCC8] px-5 py-4 text-sm text-zinc-600">
                  コメントをまとめています…
                </p>
              }
            >
              <DayComment commentPromise={commentPromise} />
            </Suspense>
            <DailyCalorieBand meals={meals} dailyGoal={dailyCalorieGoalFromWeekly(goal)} />
            <MealRecordList date={date} meals={meals} />
          </>
        ) : null}
      </section>

      <WeightRecordPanel
        date={date}
        initialMeasuredAt={dateTimeLocalOnPageDate(date)}
        records={weights.records}
        loadError={weights.error}
      />

      <StepRecordPanel date={date} record={steps.record} loadError={steps.error} />

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">よく使うメニュー</h2>
        <form action={createCategory} className="mt-3 flex gap-2">
          <input type="hidden" name="date" value={date} />
          <input
            name="name"
            maxLength={20}
            placeholder="カテゴリーを追加"
            aria-label="新しいカテゴリー名"
            className="h-10 flex-1 rounded-xl border border-[#F5821F]/40 px-3 text-sm outline-none focus:border-[#F5821F]"
          />
          <SubmitButton
            pendingLabel="追加しています…"
            className="h-10 rounded-full border border-[#F5821F] px-4 text-sm font-medium text-[#F5821F]"
          >
            追加
          </SubmitButton>
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
                    <input type="hidden" name="date" value={date} />
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input
                      name="name"
                      defaultValue={category.name}
                      maxLength={20}
                      aria-label={`${category.name}のカテゴリー名`}
                      className="h-9 w-40 rounded-lg border border-[#F5821F]/40 px-2 text-sm font-medium text-[#F5821F] outline-none focus:border-[#F5821F]"
                    />
                    <SubmitButton pendingLabel="変更しています…" className="text-sm text-[#F5821F]">
                      変更
                    </SubmitButton>
                  </form>
                  {items.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {items.map((favorite) => (
                        <li key={favorite.id} className="flex flex-wrap items-center gap-3">
                          <FavoriteMenuToggle
                            date={date}
                            favoriteId={favorite.id}
                            checked={loggedFavoriteIds.has(favorite.id)}
                            label={`${favorite.name} ${formatKcal(favorite.kcal)}`}
                          />
                          <form action={updateFavoriteCategory} className="flex items-center gap-2">
                            <input type="hidden" name="date" value={date} />
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
                            <SubmitButton pendingLabel="移動しています…" className="text-xs text-[#F5821F]">
                              移動
                            </SubmitButton>
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
    </>
  );
}
