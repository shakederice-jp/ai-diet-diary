import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InstantLink } from "@/components/instant-link";
import { RecipeSuggestionPanel } from "@/components/recipe-suggestion-panel";
import { navQuiet } from "@/components/nav-styles";
import { NEED_MORE_RECORDS_MESSAGE, RECIPE_UNAVAILABLE_MESSAGE } from "@/lib/recipe-parse";
import { loadRecipePage } from "@/lib/recipes";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "自炊メニュー提案 | AI Diet Diary",
  description: "直近の食事記録から、自炊メニューを3品提案します。",
};

export default async function RecipesPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }

  let page;
  try {
    page = await loadRecipePage(userId);
  } catch {
    page = {
      status: "error" as const,
      message: "提案を読み込めませんでした。しばらくしてから、もう一度開いてください。",
    };
  }
  const blockedMessage = page.status === "need-records" ? NEED_MORE_RECORDS_MESSAGE : null;
  const remaining = page.status === "ready" ? page.remaining : 0;
  const history = page.status === "ready" || page.status === "need-records" ? page.history : [];

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <InstantLink href="/mypage" className={navQuiet}>
          マイページに戻る
        </InstantLink>
        <p className="mt-6 text-sm font-medium text-[#F5821F]">自炊</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">自炊メニュー提案</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          最近の食事から、家で作りやすい料理を3品提案します。
        </p>
        {page.status === "unavailable" ? (
          <p className="mt-6 rounded-2xl bg-[#FBF6EE] px-4 py-3 text-sm leading-6 text-zinc-800">
            {RECIPE_UNAVAILABLE_MESSAGE}
          </p>
        ) : null}
        {page.status === "error" ? (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{page.message}</p>
        ) : null}
        {page.status === "unavailable" || page.status === "error" ? null : (
          <div className="mt-6">
            <RecipeSuggestionPanel
              remaining={remaining}
              history={history}
              blockedMessage={blockedMessage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
