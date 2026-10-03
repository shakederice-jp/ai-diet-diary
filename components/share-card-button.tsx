"use client";

import { useEffect, useRef, useState } from "react";
import { createShareCard, removeShareCard, type ShareActionState } from "@/app/share/actions";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8] disabled:opacity-60";

const actionClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-full px-5 text-base font-medium";

export function ShareCardButton({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ShareActionState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const creating = useRef(false);

  useEffect(() => {
    setResult(null);
    setOpen(false);
    setNotice(null);
  }, [date]);

  async function openShare() {
    setOpen(true);
    setNotice(null);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    if (result?.ok || creating.current) {
      return;
    }
    creating.current = true;
    setPending(true);
    try {
      const next = await createShareCard(date);
      setResult(next);
    } finally {
      creating.current = false;
      setPending(false);
    }
  }

  async function shareNative() {
    if (!result?.ok) {
      return;
    }
    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "ai-diet-share.png", { type: "image/png" });
      const payload = { title: result.name, text: result.text, url: result.pageUrl };
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ ...payload, files: [file] });
        return;
      }
      await navigator.share(payload);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setNotice("この端末のシェアを完了できませんでした。");
    }
  }

  async function copyLink() {
    if (!result?.ok) {
      return;
    }
    await navigator.clipboard.writeText(result.pageUrl);
    setNotice("リンクをコピーしました。");
  }

  async function remove() {
    if (!result?.ok) {
      return;
    }
    setPending(true);
    const removed = await removeShareCard(result.id);
    setPending(false);
    if (!removed.ok) {
      setNotice(removed.error);
      return;
    }
    setResult(null);
    setOpen(false);
  }

  const xUrl = result?.ok
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(result.text)}&url=${encodeURIComponent(result.pageUrl)}`
    : "";

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
            {pending && !result?.ok ? <p className="mt-6 text-sm text-zinc-600">ひとことを作っています…</p> : null}
            {result && !result.ok ? <p className="mt-6 text-sm text-red-800">{result.error}</p> : null}
            {result?.ok ? (
              <>
                <img src={result.imageUrl} alt={`${result.name}のシェアカード。${result.text}`} className="mt-4 w-full rounded-2xl" />
                <div className="mt-4 flex flex-col gap-3">
                  {canNativeShare ? (
                    <button type="button" className={`${actionClass} bg-[#F5821F] text-white`} onClick={shareNative}>
                      この端末でシェア
                    </button>
                  ) : null}
                  <a href={xUrl} target="_blank" rel="noopener noreferrer" className={`${actionClass} bg-[#F5821F] text-white`}>
                    Xでシェア
                  </a>
                  <button type="button" className={`${actionClass} border border-[#F5821F] text-[#F5821F]`} onClick={copyLink}>
                    リンクをコピー
                  </button>
                  <a href={result.imageUrl} download="ai-diet-share.png" className={`${actionClass} border border-[#E4D7C6] text-zinc-700`}>
                    画像を保存
                  </a>
                  <button type="button" className={`${actionClass} border border-[#E4D7C6] text-zinc-700`} onClick={remove} disabled={pending}>
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
