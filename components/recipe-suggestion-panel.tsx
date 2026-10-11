"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { suggestRecipes, type RecipeFormState } from "@/app/recipes/actions";
import { RecipeCards } from "@/components/recipe-cards";
import {
  RECIPE_DAILY_LIMIT,
  RECIPE_LIMIT_MESSAGE,
  type SavedRecipe,
} from "@/lib/recipe-parse";

const initialState: RecipeFormState = { error: null, notice: null, result: null };

function formatSavedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SuggestButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#F5821F] px-6 text-base font-medium text-white hover:bg-[#E06E0C] disabled:opacity-70 sm:w-auto"
    >
      {pending ? (
        <>
          <span
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
          />
          提案を考えています…
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function RecipeSuggestionPanel({
  remaining,
  history,
  blockedMessage,
}: {
  remaining: number;
  history: SavedRecipe[];
  blockedMessage: string | null;
}) {
  const router = useRouter();
  const refreshedId = useRef<string | null>(null);
  const [state, action] = useActionState(suggestRecipes, initialState);
  useEffect(() => {
    const id = state.result?.id;
    if (!id || refreshedId.current === id) {
      return;
    }
    refreshedId.current = id;
    router.refresh();
  }, [state.result, router]);
  const notice = state.notice ?? blockedMessage ?? (remaining <= 0 ? RECIPE_LIMIT_MESSAGE : null);
  const canAsk = !blockedMessage && remaining > 0;

  return (
    <div>
      {canAsk ? (
        <form action={action}>
          <p className="text-sm leading-6 text-zinc-600">今日はあと{remaining}回、提案できます。</p>
          <div className="mt-3">
            <SuggestButton disabled={false} label={state.error ? "もう一度試す" : "提案してもらう"} />
          </div>
        </form>
      ) : notice ? (
        <p className="rounded-2xl bg-[#FBF6EE] px-4 py-3 text-sm leading-6 text-zinc-800">{notice}</p>
      ) : null}
      {state.error ? (
        <div className="mt-4">
          <p className="text-sm leading-6 text-red-800" role="alert">
            {state.error}
          </p>
          {canAsk ? null : (
            <form action={action} className="mt-3">
              <SuggestButton disabled={false} label="もう一度試す" />
            </form>
          )}
        </div>
      ) : null}
      {state.notice && canAsk ? (
        <p className="mt-4 rounded-2xl bg-[#FBF6EE] px-4 py-3 text-sm leading-6 text-zinc-800">{state.notice}</p>
      ) : null}
      {state.result ? (
        <section className="mt-8" aria-label="今回の提案">
          <h2 className="text-base font-medium text-[#F5821F]">今回の提案</h2>
          <div className="mt-4">
            <RecipeCards recipe={state.result} />
          </div>
        </section>
      ) : null}
      <details className="mt-8 rounded-2xl border border-[#E4D7C6]">
        <summary className="flex min-h-[52px] cursor-pointer items-center px-4 text-sm font-medium text-[#F5821F]">
          保存済みの提案を見る
        </summary>
        <div className="flex flex-col gap-6 px-4 pb-4">
          {history.length === 0 ? (
            <p className="text-sm leading-6 text-zinc-600">まだ保存された提案はありません。</p>
          ) : (
            history.map((item) => (
              <section key={item.id} aria-label={formatSavedAt(item.createdAt)}>
                <h3 className="text-sm font-medium text-zinc-950">{formatSavedAt(item.createdAt)}</h3>
                <div className="mt-3">
                  <RecipeCards recipe={item} />
                </div>
              </section>
            ))
          )}
        </div>
      </details>
      <p className="sr-only">1日の上限は{RECIPE_DAILY_LIMIT}回です。</p>
    </div>
  );
}
