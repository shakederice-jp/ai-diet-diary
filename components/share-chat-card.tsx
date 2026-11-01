import {
  SHARE_BRAND,
  SHARE_DISCLAIMER,
  SHARE_DOMAIN,
  displayShareLine,
} from "@/lib/share-situations";

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
  situation: string | null;
  reply: string;
  streakDays: number | null;
  weightLabel: string | null;
}) {
  const line = situation?.trim() ? displayShareLine(situation.trim()) : "";
  const answer = reply.trim();
  return (
    <article className="w-full max-w-full rounded-3xl bg-[#FBF6EE] p-4 text-zinc-900" aria-label="シェアカード">
      {line ? (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#F5821F] px-4 py-3 text-white">
            <p className="text-xs font-medium text-white/80">わたし</p>
            <p className="mt-1 text-base leading-7 break-words">{line}</p>
          </div>
        </div>
      ) : null}
      {answer ? (
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
              <p className="text-base leading-7 break-words">{answer}</p>
            </div>
          </div>
        </div>
      ) : null}
      {streakDays || weightLabel ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {streakDays ? (
            <span className="rounded-full bg-[#E6D9C8] px-3 py-1 text-sm text-[#6B5344]">記録 {streakDays}日目</span>
          ) : null}
          {weightLabel ? (
            <span className="rounded-full bg-[#E6D9C8] px-3 py-1 text-sm text-[#6B5344]">{weightLabel}</span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4">
        <p className="text-sm font-medium text-zinc-900">{SHARE_BRAND}</p>
        <p className="text-sm text-[#F5821F]">{SHARE_DOMAIN}</p>
        <p className="mt-1 text-xs text-zinc-500">{SHARE_DISCLAIMER}</p>
      </div>
    </article>
  );
}
