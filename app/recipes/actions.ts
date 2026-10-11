"use server";

import { revalidatePath } from "next/cache";
import { RECIPE_FAILED_MESSAGE, type SavedRecipe } from "@/lib/recipe-parse";
import { createRecipeSuggestion } from "@/lib/recipes";
import { getAuthUserId } from "@/lib/supabase/server";

export type RecipeFormState = {
  error: string | null;
  notice: string | null;
  result: SavedRecipe | null;
};

export async function suggestRecipes(
  _state: RecipeFormState,
  _formData: FormData,
): Promise<RecipeFormState> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "ログインしてください。", notice: null, result: null };
  }

  try {
    const created = await createRecipeSuggestion(userId);
    if (!created.ok) {
      if (created.kind === "failed") {
        return { error: created.message, notice: null, result: null };
      }
      return { error: null, notice: created.message, result: null };
    }
    revalidatePath("/recipes");
    return { error: null, notice: null, result: created.recipe };
  } catch {
    return { error: RECIPE_FAILED_MESSAGE, notice: null, result: null };
  }
}
