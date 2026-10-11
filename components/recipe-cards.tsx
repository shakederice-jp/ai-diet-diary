import type { RecipeSuggestion } from "@/lib/recipe-parse";

export function RecipeCards({ recipe }: { recipe: RecipeSuggestion }) {
  return (
    <div>
      {recipe.mainIngredients.length > 0 ? (
        <p className="text-sm leading-6 text-zinc-700">
          よく使っていそうな食材: {recipe.mainIngredients.join("、")}
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-4">
        {recipe.suggestions.map((dish, index) => (
          <article key={`${dish.name}-${index}`} className="break-words rounded-2xl bg-[#FBF6EE] p-4">
            <p className="text-xs font-medium text-[#F5821F]">{dish.type}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">{dish.name}</h3>
            <p className="mt-2 text-sm text-zinc-800">1人前の目安 約{dish.kcalPerServing}kcal</p>
            <p className="mt-3 text-sm leading-6 text-zinc-800">
              <span className="font-medium text-zinc-950">満腹になる理由 </span>
              {dish.whyFilling}
            </p>
            <h4 className="mt-4 text-sm font-medium text-zinc-950">材料</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-800">
              {dish.ingredients.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
            <h4 className="mt-4 text-sm font-medium text-zinc-950">作り方</h4>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-800">
              {dish.steps.map((step, stepIndex) => (
                <li key={`${stepIndex}-${step}`}>{step}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-6 text-[#6B4A32]">{dish.tip}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#E7DCC8] px-4 py-3 text-sm leading-6 text-zinc-800">{recipe.closing}</p>
    </div>
  );
}
