import { removeShareCard } from "@/app/share/actions";
import { getAdvisor } from "@/lib/advisors";
import type { OwnedShareCard } from "@/lib/share-store";
import { situationBubble } from "@/lib/share-situations";

export function ShareCardList({ cards }: { cards: OwnedShareCard[] }) {
  if (cards.length === 0) {
    return null;
  }
  return (
    <section className="mt-8" aria-label="シェアしたひとこと">
      <h2 className="text-sm font-medium text-zinc-950">シェアしたひとこと</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {cards.map((card) => (
          <li key={card.id} className="rounded-2xl bg-[#E7DCC8] p-4">
            <p className="text-sm font-medium text-[#F5821F]">{getAdvisor(card.characterId).name}</p>
            {card.situation ? <p className="mt-1 text-base leading-7 text-zinc-800">{situationBubble(card.situation)}</p> : null}
            <p className={`${card.situation ? "" : "mt-1 "}text-base leading-7 text-zinc-800`}>{card.text}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={`/s/${card.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-[#F5821F]">
                公開ページを開く
              </a>
              <form
                action={async () => {
                  "use server";
                  await removeShareCard(card.id);
                }}
              >
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-sm font-medium text-zinc-700"
                >
                  削除
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
