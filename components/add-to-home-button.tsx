"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

const outlineButton =
  "inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#F5821F] bg-[#FBF6EE] px-5 text-base font-medium text-[#F5821F] hover:bg-[#E7DCC8]";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallSnapshot = {
  visible: boolean;
  prompt: InstallPrompt | null;
  offered: boolean;
};

const hiddenSnapshot: InstallSnapshot = { visible: false, prompt: null, offered: false };
let deferredInstall: InstallPrompt | null = null;
let installWasOffered = false;
let installed = false;
let currentSnapshot: InstallSnapshot = hiddenSnapshot;
const installListeners = new Set<() => void>();

function notifyInstallListeners() {
  for (const listener of installListeners) {
    listener();
  }
}

function launchedFromHomeScreen() {
  if (installed) {
    return true;
  }
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function readSnapshot(): InstallSnapshot {
  const prompt = deferredInstall;
  const visible = !launchedFromHomeScreen();
  const offered = installWasOffered;
  if (
    currentSnapshot.visible === visible &&
    currentSnapshot.prompt === prompt &&
    currentSnapshot.offered === offered
  ) {
    return currentSnapshot;
  }
  currentSnapshot = { visible, prompt, offered };
  return currentSnapshot;
}

function subscribeInstall(listener: () => void) {
  installListeners.add(listener);
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  return () => {
    installListeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstall = event as InstallPrompt;
    installWasOffered = true;
    notifyInstallListeners();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstall = null;
    installed = true;
    notifyInstallListeners();
  });
}

function isIos() {
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }
  return window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
}

function ShareButtonPicture() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-12 shrink-0 text-[#F5821F]">
      <path
        d="M24 28V8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 16l8-8 8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 20H14a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V24a4 4 0 0 0-4-4h-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IosInstallGuide({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-3xl bg-[#F3EBDD] p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="pt-3 text-base font-medium text-zinc-950">
            ホーム画面に追加
          </h2>
          <button ref={closeRef} type="button" className={outlineButton} onClick={onClose}>
            閉じる
          </button>
        </div>
        <ol className="mt-4 space-y-4 text-base leading-7 text-zinc-800">
          <li className="flex items-center gap-3">
            <ShareButtonPicture />
            <span>①画面下の共有ボタン(□に↑)を押す</span>
          </li>
          <li>②『ホーム画面に追加』を選ぶ</li>
          <li>③右上の『追加』を押す</li>
        </ol>
      </div>
    </div>
  );
}

export function AddToHomeButton({ className = "" }: { className?: string }) {
  const install = useSyncExternalStore(subscribeInstall, readSnapshot, () => hiddenSnapshot);
  const [iosOpen, setIosOpen] = useState(false);
  const [desktopNote, setDesktopNote] = useState(false);

  if (!install.visible) {
    return null;
  }

  async function onClick() {
    if (install.prompt) {
      const prompt = install.prompt;
      deferredInstall = null;
      notifyInstallListeners();
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") {
          installed = true;
          notifyInstallListeners();
        }
      } catch {
        setDesktopNote(true);
      }
      return;
    }
    if (isIos()) {
      setDesktopNote(false);
      setIosOpen(true);
      return;
    }
    if (install.offered) {
      return;
    }
    setIosOpen(false);
    setDesktopNote(true);
  }

  return (
    <div className={className}>
      <button type="button" className={outlineButton} onClick={onClick}>
        <span aria-hidden="true">📱</span> スマホに登録
      </button>
      {desktopNote ? (
        <p className="mt-2 text-sm text-zinc-700" role="status">
          スマホで開いてください
        </p>
      ) : null}
      {iosOpen ? <IosInstallGuide onClose={() => setIosOpen(false)} /> : null}
    </div>
  );
}
