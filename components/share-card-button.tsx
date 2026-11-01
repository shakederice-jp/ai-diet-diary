"use client";

import { useState } from "react";
import { setDiaryShareReply } from "@/app/diary/actions";
import { prepareShare, publishShare, removeShareCard } from "@/app/share/actions";
import { ShareChatCard } from "@/components/share-chat-card";
import { DIARY_PRIVACY_NOTICE } from "@/lib/diary-shared";
import { clipText, textLength } from "@/lib/diary-text";
import {
  isShareCharacterId,
  sharePostText,
  visibleStreakDays,
  type ShareCharacterId,
} from "@/lib/share-situations";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8] disabled:opacity-60";

const actionClass =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-5 text-base font-medium";

export function ShareCardButton({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState<ShareCharacterId | "">("");
  const [name, setName] = useState("");
  const [shareText, setShareText] = useState("");
  const [includeReply, setIncludeReply] = useState(false);
  const [replyLocked, setReplyLocked] = useState(false);
  const [reply, setReply] = useState("");
  const [showStreak, setShowStreak] = useState(true);
  const [showWeight, setShowWeight] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [weightLabel, setWeightLabel] = useState<string | null>(null);
  const [card, setCard] = useState<{ id: string; pageUrl: string; imageUrl: string } | null>(null);

  async function openShare() {
    setOpen(true);
    setPending(true);
    setError(null);
    setNotice(null);
    const prepared = await prepareShare(date);
    setPending(false);
    if (!prepared.ok) {
      setError(prepared.error);
      return;
    }
    if (!isShareCharacterId(prepared.characterId)) {
      setError("アドバイザーを選ぶと、シェアできます。");
      return;
    }
    setCharacterId(prepared.characterId);
    setName(prepared.name);
    setShareText(clipText(prepared.shareText, 80));
    setIncludeReply(prepared.includeReply && !prepared.replyLocked);
    setReplyLocked(prepared.replyLocked);
    setReply(prepared.reply ?? "");
    setShowStreak(prepared.showStreak);
    setShowWeight(prepared.showWeight);
    setStreakDays(prepared.streakDays);
    setWeightLabel(prepared.weightLabel);
    if (prepared.cardId && prepared.pageUrl && prepared.imageUrl) {
      setCard({ id: prepared.cardId, pageUrl: prepared.pageUrl, imageUrl: prepared.imageUrl });
    }
  }

  async function changeReply(next: boolean) {
    if (replyLocked || !reply.trim()) {
      return;
    }
    setIncludeReply(next);
    const saved = await setDiaryShareReply(date, next);
    if (!saved.ok) {
      setIncludeReply((current) => !current);
      setNotice(saved.error);
      return;
    }
    setIncludeReply(saved.shareReply);
    if (saved.locked) {
      setReplyLocked(true);
    }
  }

  async function ensurePublished() {
    if (!isShareCharacterId(characterId)) {
      return null;
    }
    setPublishing(true);
    const published = await publishShare(date, {
      shareText,
      includeReply: includeReply && !replyLocked,
      showStreak,
      showWeight,
    });
    setPublishing(false);
    if (!published.ok) {
      setError(published.error);
      return null;
    }
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
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(published.pageUrl);
      setNotice("リンクをコピーしました。");
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

  const shownStreak = visibleStreakDays(showStreak, streakDays);
  const shownWeight = showWeight ? weightLabel : null;
  const shownReply = includeReply && !replyLocked ? reply : "";
  const postText = isShareCharacterId(characterId)
    ? sharePostText(shareText || "今日の記録", name, characterId)
    : "";
  const busy = pending || publishing;

  return (
    <>
      <button type="button" className={`mt-4 ${buttonClass}`} onClick={openShare} disabled={pending}>
        シェアする
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="シェアのプレビュー"
            className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#F3EBDD] shadow-lg sm:max-h-[90vh] sm:rounded-3xl"
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#F5821F]">シェアする</p>
                <button type="button" className={buttonClass} onClick={() => setOpen(false)}>
                  閉じる
                </button>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-950">公開されます</p>
              <p className="mt-1 text-xs leading-5 break-words text-zinc-700">{DIARY_PRIVACY_NOTICE}</p>
              {pending ? <p className="mt-6 text-sm text-zinc-600">カードを準備しています…</p> : null}
              {error ? <p className="mt-4 text-sm leading-6 text-red-800">{error}</p> : null}
              {!pending && name ? (
                <>
                  <div className="mt-4">
                    <ShareChatCard
                      characterId={characterId}
                      name={name}
                      situation={shareText}
                      reply={shownReply}
                      streakDays={shownStreak}
                      weightLabel={shownWeight}
                    />
                  </div>
                  <label className="mt-4 block">
                    <span className="text-sm font-medium text-zinc-800">シェアに載せる文</span>
                    <textarea
                      value={shareText}
                      onChange={(event) => setShareText(clipText(event.target.value, 80))}
                      maxLength={80}
                      rows={3}
                      className="mt-2 w-full resize-y rounded-2xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 py-3 text-base leading-7 break-words text-zinc-900 outline-none"
                    />
                    <span className="mt-1 block text-right text-xs tabular-nums text-zinc-600">{textLength(shareText)}/80</span>
                  </label>
                  <div className="mt-2 flex flex-col gap-2">
                    <SwitchRow
                      label="AIの返事を載せる"
                      on={includeReply && !replyLocked}
                      disabled={replyLocked || !reply.trim() || busy}
                      onChange={changeReply}
                    />
                    {replyLocked ? <p className="text-xs leading-5 text-zinc-600">この返事は、シェアに載せられません</p> : null}
                    <SwitchRow label="記録の日数を載せる" on={showStreak} disabled={busy} onChange={setShowStreak} />
                    <SwitchRow label="体重の変化を載せる" on={showWeight} disabled={busy} onChange={setShowWeight} />
                  </div>
                  <p className="mt-4 text-sm leading-6 break-words whitespace-pre-wrap text-zinc-700">{postText}</p>
                  <div className="mt-4 flex flex-col gap-3">
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
            <div className="border-t border-[#E4D7C6] bg-[#F3EBDD] p-4">
              <button
                type="button"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#F5821F] text-base font-medium text-white disabled:opacity-60"
                onClick={shareNative}
                disabled={busy || !name}
              >
                {publishing ? "準備しています…" : "シェアする"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SwitchRow({
  label,
  on,
  disabled,
  onChange,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-[#FBF6EE] px-3 py-2">
      <span className="text-sm text-zinc-800">{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="w-8 text-right text-xs font-medium text-zinc-700">{on ? "ON" : "OFF"}</span>
        <input
          type="checkbox"
          role="switch"
          className="size-5 accent-[#F5821F]"
          checked={on}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={label}
        />
      </span>
    </label>
  );
}
