import { SHARE_BRAND, SHARE_DISCLAIMER, SHARE_DOMAIN, situationBubble } from "@/lib/share-situations";

export function ShareChatCard({
  characterId,
  name,
  situation,
  reply,
  streakDays,
  weightLabel,
}: {
  characterId: string;
  name: string;
  situation: string;
  reply: string;
  streakDays: number | null;
  weightLabel: string | null;
}) {
  return (
    <article className="rounded-3xl bg-[#FBF6EE] p-4 text-zinc-900" aria-label="シェアカード">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#F5821F] px-4 py-3 text-white">
          <p className="text-xs font-medium text-white/80">わたし</p>
          <p className="mt-1 text-base leading-7">{situationBubble(situation)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <img
          src={`/characters/${characterId}.svg`}
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-2xl bg-[#F3EBDD]"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#F5821F]">{name}</p>
          <div className="mt-1 rounded-2xl rounded-tl-md bg-[#F3EBDD] px-4 py-3">
            <p className="text-base leading-7">{reply || "…"}</p>
          </div>
        </div>
      </div>
      {streakDays || weightLabel ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {streakDays ? (
            <p className="rounded-full bg-[#E6D9C8] px-3 py-1 text-xs font-medium text-[#6B5344]">記録 {streakDays}日目</p>
          ) : null}
          {weightLabel ? (
            <p className="rounded-full bg-[#E6D9C8] px-3 py-1 text-xs font-medium text-[#6B5344]">{weightLabel}</p>
          ) : null}
        </div>
      ) : null}
      <p className="mt-4 text-xs text-[#8A7564]">{SHARE_BRAND}</p>
      <p className="text-xs text-[#F5821F]">{SHARE_DOMAIN}</p>
      <p className="mt-1 text-xs text-[#8A7564]">{SHARE_DISCLAIMER}</p>
    </article>
  );
}
