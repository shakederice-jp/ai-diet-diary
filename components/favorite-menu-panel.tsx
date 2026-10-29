"use client";

import { useEffect, useRef, useState } from "react";
import {
  addFavoriteToDay,
  createCategory,
  removeCategory,
  removeFavoriteMenu,
  renameMenuCategory,
  saveFavoriteMenu,
} from "@/app/days/[date]/actions";
import { SubmitButton } from "@/components/submit-button";
import { formatKcal } from "@/lib/calendar";
import type { FavoriteMenu, FavoriteUse, MenuCategory } from "@/lib/meals";

const SORTS = [
  { id: "often", label: "よく使う順" },
  { id: "recent", label: "最近使った順" },
  { id: "registered", label: "登録順" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#F5821F]/40 bg-white px-3 text-base outline-none focus:border-[#F5821F]";
const quietButton =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8] disabled:opacity-60";
const outlineButton =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#F5821F] bg-[#FBF6EE] px-4 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8] disabled:opacity-60";

export function FavoriteMenuPanel({
  date,
  categories,
  favorites,
  usage,
}: {
  date: string;
  categories: MenuCategory[];
  favorites: FavoriteMenu[];
  usage: Record<string, FavoriteUse>;
}) {
  const [sort, setSort] = useState<SortId>("often");
  const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryConfirmId, setCategoryConfirmId] = useState<string | null>(null);
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(null);
  const [favoriteConfirmId, setFavoriteConfirmId] = useState<string | null>(null);
  const locks = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!addedId) {
      return;
    }
    const timer = window.setTimeout(() => setAddedId(null), 2000);
    return () => window.clearTimeout(timer);
  }, [addedId]);

  function isOpen(categoryId: string, count: number) {
    if (categoryId in openOverride) {
      return openOverride[categoryId];
    }
    return count > 0;
  }

  function toggleCategory(categoryId: string, count: number) {
    setOpenOverride((current) => ({
      ...current,
      [categoryId]: !isOpen(categoryId, count),
    }));
  }

  function begin(id: string) {
    if (locks.current.has(id)) {
      return false;
    }
    locks.current.add(id);
    setPendingIds((current) => [...current, id]);
    return true;
  }

  function finish(id: string) {
    locks.current.delete(id);
    setPendingIds((current) => current.filter((item) => item !== id));
  }

  async function addMenu(favoriteId: string) {
    if (!begin(favoriteId)) {
      return;
    }
    setError(null);
    try {
      const result = await addFavoriteToDay(date, favoriteId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAddedId(favoriteId);
    } finally {
      finish(favoriteId);
    }
  }

  async function saveMenu(favorite: FavoriteMenu, formData: FormData) {
    if (!begin(favorite.id)) {
      return;
    }
    setError(null);
    try {
      const result = await saveFavoriteMenu(date, favorite.id, {
        name: String(formData.get("name") ?? ""),
        kcal: String(formData.get("kcal") ?? ""),
        categoryId: String(formData.get("categoryId") ?? ""),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingFavoriteId(null);
    } finally {
      finish(favorite.id);
    }
  }

  async function deleteMenu(favoriteId: string) {
    if (!begin(favoriteId)) {
      return;
    }
    setError(null);
    try {
      const result = await removeFavoriteMenu(date, favoriteId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFavoriteConfirmId(null);
      setEditingFavoriteId(null);
    } finally {
      finish(favoriteId);
    }
  }

  async function saveGroup(categoryId: string, formData: FormData) {
    if (!begin(categoryId)) {
      return;
    }
    setError(null);
    try {
      const result = await renameMenuCategory(date, categoryId, String(formData.get("name") ?? ""));
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingCategoryId(null);
    } finally {
      finish(categoryId);
    }
  }

  async function deleteGroup(categoryId: string) {
    if (!begin(categoryId)) {
      return;
    }
    setError(null);
    try {
      const result = await removeCategory(date, categoryId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCategoryConfirmId(null);
      setEditingCategoryId(null);
    } finally {
      finish(categoryId);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">よく使うメニュー</h2>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="並び順">
        {SORTS.map((option) => {
          const selected = sort === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setSort(option.id)}
              className={
                selected
                  ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[#F5821F] px-3 text-sm font-medium text-white"
                  : "inline-flex min-h-11 items-center justify-center rounded-full border border-[#F5821F]/40 bg-[#FBF6EE] px-3 text-sm font-medium text-[#6B4A32]"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <form action={createCategory} className="mt-3 flex gap-2">
        <input type="hidden" name="date" value={date} />
        <input
          name="name"
          maxLength={20}
          placeholder="カテゴリーを追加"
          aria-label="新しいカテゴリー名"
          className="min-h-11 flex-1 rounded-xl border border-[#F5821F]/40 bg-white px-3 text-base outline-none focus:border-[#F5821F]"
        />
        <SubmitButton
          pendingLabel="追加しています…"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F5821F] px-4 text-sm font-medium text-[#F5821F]"
        >
          追加
        </SubmitButton>
      </form>
      {error ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {categories.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          料理を登録すると、和食や麺類などのカテゴリーに分類されます。
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {categories.map((category) => {
            const items = sortFavorites(
              favorites.filter((favorite) => favorite.categoryId === category.id),
              sort,
              usage,
            );
            const open = isOpen(category.id, items.length);
            const editing = editingCategoryId === category.id;
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex min-h-11 min-w-0 flex-1 items-center text-left text-base font-medium text-[#F5821F]"
                    aria-expanded={open}
                    onClick={() => toggleCategory(category.id, items.length)}
                  >
                    <span className="min-w-0 break-words">
                      {category.name}
                      {items.length === 0 ? `(${items.length})` : ""}
                    </span>
                  </button>
                  {open ? (
                    <button
                      type="button"
                      className={quietButton}
                      onClick={() => {
                        setEditingCategoryId(editing ? null : category.id);
                        setCategoryConfirmId(null);
                      }}
                    >
                      編集
                    </button>
                  ) : null}
                </div>
                {open && editing ? (
                  <div className="mt-2 rounded-2xl bg-[#FBF6EE] p-3">
                    <form
                      className="flex flex-col gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void saveGroup(category.id, new FormData(event.currentTarget));
                      }}
                    >
                      <label className="text-sm text-[#6B4A32]" htmlFor={`category-${category.id}`}>
                        カテゴリー名
                      </label>
                      <input
                        id={`category-${category.id}`}
                        name="name"
                        defaultValue={category.name}
                        maxLength={20}
                        required
                        className={fieldClass}
                      />
                      <button
                        type="submit"
                        className={`${outlineButton} w-full`}
                        disabled={pendingIds.includes(category.id)}
                      >
                        保存
                      </button>
                    </form>
                    {category.name === "その他" ? null : categoryConfirmId === category.id ? (
                      <div className="mt-3">
                        <p className="text-sm leading-6 text-zinc-800">
                          中のメニューは『その他』に移します
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className={outlineButton}
                            disabled={pendingIds.includes(category.id)}
                            onClick={() => deleteGroup(category.id)}
                          >
                            はい
                          </button>
                          <button
                            type="button"
                            className={quietButton}
                            onClick={() => setCategoryConfirmId(null)}
                          >
                            いいえ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`${quietButton} mt-2 text-red-800`}
                        onClick={() => setCategoryConfirmId(category.id)}
                      >
                        削除
                      </button>
                    )}
                  </div>
                ) : null}
                {open && items.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-500">メニューはまだありません。</p>
                ) : null}
                {open && items.length > 0 ? (
                  <ul className="mt-1 space-y-2">
                    {items.map((favorite) => {
                      const menuOpen = editingFavoriteId === favorite.id;
                      const adding = pendingIds.includes(favorite.id);
                      return (
                        <li key={favorite.id} className="rounded-2xl bg-[#FBF6EE] px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex min-h-11 min-w-0 flex-1 flex-wrap items-baseline gap-x-2 text-left"
                              aria-expanded={menuOpen}
                              onClick={() => {
                                setEditingFavoriteId(menuOpen ? null : favorite.id);
                                setFavoriteConfirmId(null);
                              }}
                            >
                              <span className="min-w-0 break-words text-base text-zinc-900">
                                {favorite.name}
                              </span>
                              <span className="text-sm text-[#8A7360]">{formatKcal(favorite.kcal)}</span>
                            </button>
                            <button
                              type="button"
                              className={quietButton}
                              onClick={() => {
                                setEditingFavoriteId(menuOpen ? null : favorite.id);
                                setFavoriteConfirmId(null);
                              }}
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              className={outlineButton}
                              disabled={adding}
                              onClick={() => addMenu(favorite.id)}
                            >
                              追加
                            </button>
                          </div>
                          {addedId === favorite.id ? (
                            <p className="mt-1 text-sm text-[#F5821F]" role="status">
                              追加しました
                            </p>
                          ) : null}
                          {menuOpen ? (
                            <form
                              className="mt-2 flex flex-col gap-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                void saveMenu(favorite, new FormData(event.currentTarget));
                              }}
                            >
                              <label className="text-sm text-[#6B4A32]" htmlFor={`name-${favorite.id}`}>
                                名前
                              </label>
                              <input
                                id={`name-${favorite.id}`}
                                name="name"
                                defaultValue={favorite.name}
                                maxLength={80}
                                required
                                className={fieldClass}
                              />
                              <label className="text-sm text-[#6B4A32]" htmlFor={`kcal-${favorite.id}`}>
                                カロリー
                              </label>
                              <input
                                id={`kcal-${favorite.id}`}
                                name="kcal"
                                inputMode="numeric"
                                defaultValue={String(favorite.kcal)}
                                required
                                className={fieldClass}
                              />
                              <label className="text-sm text-[#6B4A32]" htmlFor={`group-${favorite.id}`}>
                                カテゴリー
                              </label>
                              <select
                                id={`group-${favorite.id}`}
                                name="categoryId"
                                defaultValue={favorite.categoryId}
                                className={fieldClass}
                              >
                                {categories.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                              <button type="submit" className={`${outlineButton} w-full`} disabled={adding}>
                                保存
                              </button>
                              {favoriteConfirmId === favorite.id ? (
                                <div>
                                  <p className="text-sm leading-6 text-zinc-800">
                                    このメニューを削除しますか。過去の食事記録は消えません。
                                  </p>
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      type="button"
                                      className={outlineButton}
                                      disabled={adding}
                                      onClick={() => deleteMenu(favorite.id)}
                                    >
                                      はい
                                    </button>
                                    <button
                                      type="button"
                                      className={quietButton}
                                      onClick={() => setFavoriteConfirmId(null)}
                                    >
                                      いいえ
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className={`${quietButton} text-red-800`}
                                  onClick={() => setFavoriteConfirmId(favorite.id)}
                                >
                                  削除
                                </button>
                              )}
                            </form>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function sortFavorites(
  items: FavoriteMenu[],
  sort: SortId,
  usage: Record<string, FavoriteUse>,
) {
  return [...items].sort((left, right) => {
    if (sort === "often") {
      const diff = (usage[right.id]?.count ?? 0) - (usage[left.id]?.count ?? 0);
      if (diff !== 0) {
        return diff;
      }
    } else if (sort === "recent") {
      const leftUsed = usage[left.id]?.lastUsedAt ?? "";
      const rightUsed = usage[right.id]?.lastUsedAt ?? "";
      if (leftUsed !== rightUsed) {
        return leftUsed < rightUsed ? 1 : -1;
      }
    } else if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? -1 : 1;
    }
    return left.name.localeCompare(right.name, "ja");
  });
}
