"use client";

import { useRef, useState } from "react";
import { loadShareReply, prepareShare, publishShare, removeShareCard } from "@/app/share/actions";
import { ShareChatCard } from "@/components/share-chat-card";
import {
  SHARE_SITUATIONS,
  isShareCharacterId,
  sharePostText,
  shareSituationById,
  visibleStreakDays,
  type ShareSituationId,
} from "@/lib/share-situations";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8] disabled:opacity-60";

const actionClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-full px-5 text-base font-medium";

const choiceClass =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-medium";

export function ShareCardButton({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [replyPending, setReplyPending] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState("sharp");
  const [name, setName] = useState("");
  const [situationId, setSituationId] = useState<ShareSituationId>("recorded");
  const [showStreak, setShowStreak] = useState(true);
  const [showWeight, setShowWeight] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [weightLabel, setWeightLabel] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [card, setCard] = useState<{ id: string; pageUrl: string; imageUrl: string } | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [prevDate, setPrevDate] = useState(date);
  const replyToken = useRef(0);

  if (date !== prevDate) {
    setPrevDate(date);
    setOpen(false);
    setError(null);
    setNotice(null);
    setName("");
    setCard(null);
    setReply("");
  }

  async function fetchReply(nextSituation: ShareSituationId) {
    const token = replyToken.current + 1;
    replyToken.current = token;
    setReplyPending(true);
    const loaded = await loadShareReply(date, nextSituation);
    if (token !== replyToken.current) {
      return;
    }
    setReplyPending(false);
    if (!loaded.ok) {
      setError(loaded.error);
      return;
    }
    setReply(loaded.text);
  }

  async function openShare() {
    setOpen(true);
    setNotice(null);
    setError(null);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    if (name || pending) {
      return;
    }
    setPending(true);
    const prepared = await prepareShare(date);
    setPending(false);
    if (!prepared.ok) {
      setError(prepared.error);
      return;
    }
    setCharacterId(prepared.characterId);
    setName(prepared.name);
    setStreakDays(prepared.streakDays);
    setWeightLabel(prepared.weightLabel);
    setShowStreak(prepared.showStreak);
    setShowWeight(prepared.showWeight);
    if (shareSituationById(prepared.situationId)) {
      setSituationId(prepared.situationId as ShareSituationId);
    }
    if (prepared.cardId && prepared.pageUrl && prepared.imageUrl) {
      setCard({ id: prepared.cardId, pageUrl: prepared.pageUrl, imageUrl: prepared.imageUrl });
    }
    if (prepared.reply) {
      setReply(prepared.reply);
      return;
    }
    const initial = shareSituationById(prepared.situationId)?.id ?? "recorded";
    await fetchReply(initial);
  }

  async function chooseSituation(next: ShareSituationId) {
    if (next === situationId) {
      return;
    }
    setSituationId(next);
    setNotice(null);
    await fetchReply(next);
  }

  async function ensurePublished() {
    if (!isShareCharacterId(characterId)) {
      return null;
    }
    setPublishing(true);
    const published = await publishShare(date, { situationId, showStreak, showWeight });
    setPublishing(false);
    if (!published.ok) {
      setError(published.error);
      return null;
    }
    setReply(published.text);
    setName(published.name);
    const next = { id: published.id, pageUrl: published.pageUrl, imageUrl: published.imageUrl };
    setCard(next);
    return published;
  }

  async function shareNative() {
    const published = await ensurePublished();
    if (!published) {
      return;
    }
    try {
      const response = await fetch(`${published.imageUrl}?v=${Date.now()}`);
      const blob = await response.blob();
      const file = new File([blob], "ai-diet-share.png", { type: "image/png" });
      const payload = { title: published.name, text: published.postText, url: published.pageUrl };
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ ...payload, files: [file] });
        return;
      }
      await navigator.share(payload);
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }
      setNotice("この端末のシェアを完了できませんでした。");
    }
  }

  async function shareOnX() {
    const published = await ensurePublished();
    if (!published) {
      return;
    }
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(published.postText)}&url=${encodeURIComponent(published.pageUrl)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    const published = await ensurePublished();
    if (!published) {
      return;
    }
    await navigator.clipboard.writeText(published.pageUrl);
    setNotice("リンクをコピーしました。");
  }

  async function saveImage() {
    const published = await ensurePublished();
    if (!published) {
      return;
    }
    const link = document.createElement("a");
    link.href = `${published.imageUrl}?v=${Date.now()}`;
    link.download = "ai-diet-share.png";
    link.click();
  }

  async function remove() {
    if (!card) {
      setOpen(false);
      return;
    }
    setPublishing(true);
    const removed = await removeShareCard(card.id);
    setPublishing(false);
    if (!removed.ok) {
      setNotice(removed.error);
      return;
    }
    setCard(null);
    setOpen(false);
  }

  const situation = shareSituationById(situationId);
  const postText =
    situation && isShareCharacterId(characterId) ? sharePostText(situation.text, name, characterId) : "";
  const shownStreak = visibleStreakDays(showStreak, streakDays);
  const shownWeight = showWeight ? weightLabel : null;
  const busy = pending || replyPending || publishing;

  return (
    <>
      <button type="button" className={`mt-4 ${buttonClass}`} onClick={openShare} disabled={pending}>
        シェアする
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="シェアのプレビュー"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#F3EBDD] p-5 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#F5821F]">シェアする</p>
              <button type="button" className={buttonClass} onClick={() => setOpen(false)}>
                閉じる
              </button>
            </div>
            {pending ? <p className="mt-6 text-sm text-zinc-600">カードを準備しています…</p> : null}
            {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
            {!pending && name && situation ? (
              <>
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium text-zinc-800">今日のわたし</legend>
                  <div className="mt-2 flex flex-col gap-2">
                    {SHARE_SITUATIONS.map((item) => {
                      const selected = item.id === situationId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={selected}
                          className={`${choiceClass} ${selected ? "bg-[#F5821F] text-white" : "border border-[#E4D7C6] bg-[#FBF6EE] text-zinc-800"}`}
                          onClick={() => chooseSituation(item.id)}
                          disabled={busy}
                        >
                          {item.text}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    aria-pressed={showStreak}
                    className={`${choiceClass} border border-[#E4D7C6] bg-[#FBF6EE] text-zinc-800`}
                    onClick={() => setShowStreak((current) => !current)}
                  >
                    記録の日数を{showStreak ? "載せる" : "載せない"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={showWeight}
                    className={`${choiceClass} border border-[#E4D7C6] bg-[#FBF6EE] text-zinc-800`}
                    onClick={() => setShowWeight((current) => !current)}
                  >
                    体重の変化を{showWeight ? "載せる" : "載せない"}
                  </button>
                  {showWeight ? <p className="text-xs text-zinc-500">公開されます</p> : null}
                </div>
                <div className="mt-4">
                  <ShareChatCard
                    characterId={characterId}
                    name={name}
                    situation={situation.text}
                    reply={replyPending ? "返事を書いています…" : reply}
                    streakDays={shownStreak}
                    weightLabel={shownWeight}
                  />
                </div>
                <p className="mt-4 text-sm leading-6 whitespace-pre-wrap text-zinc-700">{postText}</p>
                <div className="mt-4 flex flex-col gap-3">
                  {canNativeShare ? (
                    <button type="button" className={`${actionClass} bg-[#F5821F] text-white`} onClick={shareNative} disabled={busy}>
                      この端末でシェア
                    </button>
                  ) : null}
                  <button type="button" className={`${actionClass} bg-[#F5821F] text-white`} onClick={shareOnX} disabled={busy}>
                    Xでシェア
                  </button>
                  <button type="button" className={`${actionClass} border border-[#F5821F] text-[#F5821F]`} onClick={copyLink} disabled={busy}>
                    リンクをコピー
                  </button>
                  <button type="button" className={`${actionClass} border border-[#E4D7C6] text-zinc-700`} onClick={saveImage} disabled={busy}>
                    画像を保存
                  </button>
                  <button type="button" className={`${actionClass} border border-[#E4D7C6] text-zinc-700`} onClick={remove} disabled={busy}>
                    このカードを削除
                  </button>
                </div>
              </>
            ) : null}
            {notice ? <p className="mt-3 text-sm text-zinc-700">{notice}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
