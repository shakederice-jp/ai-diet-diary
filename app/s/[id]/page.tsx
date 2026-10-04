import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdvisor } from "@/lib/advisors";
import { navPrimary } from "@/components/nav-styles";
import { ShareChatCard } from "@/components/share-chat-card";
import { appOrigin, getPublicShareCard, SHARE_BRAND, SHARE_DISCLAIMER } from "@/lib/share-store";
import { situationBubble } from "@/lib/share-situations";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const card = await getPublicShareCard(id);
  if (!card) {
    return { robots: { index: false, follow: false } };
  }
  const origin = await appOrigin();
  const image = `${origin}/s/${card.id}/image`;
  const advisor = getAdvisor(card.characterId);
  const title = card.situation ? situationBubble(card.situation) : advisor.name;
  return {
    title: `${title} | ${SHARE_BRAND}`,
    description: card.text,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: card.text,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: card.text,
      images: [image],
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getPublicShareCard(id);
  if (!card) {
    notFound();
  }
  const advisor = getAdvisor(card.characterId);
  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-xl">
        {card.situation ? (
          <ShareChatCard
            characterId={card.characterId}
            name={advisor.name}
            situation={card.situation}
            reply={card.text}
            streakDays={card.streakDays}
            weightLabel={card.weightLabel}
          />
        ) : (
          <>
            <img
              src={`/s/${card.id}/image`}
              alt={`${advisor.name}のシェアカード`}
              width={1200}
              height={630}
              className="w-full rounded-3xl"
            />
            <p className="mt-6 text-sm font-medium text-[#F5821F]">{advisor.name}</p>
            <p className="mt-2 text-2xl leading-9 font-semibold text-zinc-950">{card.text}</p>
            <p className="mt-3 text-xs text-zinc-600">{SHARE_DISCLAIMER}</p>
          </>
        )}
        <a href="/" className={`mt-8 ${navPrimary}`}>
          あなたも始めてみる
        </a>
      </main>
    </div>
  );
}
