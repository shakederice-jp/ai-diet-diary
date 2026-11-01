"use client";

import { useState } from "react";
import { saveDiary, setDiaryShareReply } from "@/app/diary/actions";
import { ShareCardButton } from "@/components/share-card-button";
import { getAdvisor, isAdvisorId, type AdvisorId } from "@/lib/advisors";
import { DIARY_BODY_LIMIT, DIARY_PRIVACY_NOTICE, type DiaryEntry } from "@/lib/diary-shared";
import { SHARE_SITUATIONS } from "@/lib/share-situations";
import { clipText, textLength } from "@/lib/diary-text";

export function DiaryCard({
  date,
  today,
  entry,
  advisorId,
  error,
}: {
  date: string;
  today: string;
  entry: DiaryEntry | null;
  advisorId: AdvisorId | null;
  error: string | null;
}) {
  const [body, setBody] = useState(entry?.body ?? "");
  const [savedBody, setSavedBody] = useState(entry?.body ?? "");
  const [reply, setReply] = useState(entry?.aiReply ?? null);
  const [replyAdvisorId, setReplyAdvisorId] = useState<AdvisorId | null>(entry?.advisorId ?? null);
  const [sensitive, setSensitive] = useState(entry?.replySensitive ?? false);
  const [shareReply, setShareReply] = useState(entry?.shareReply ?? true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(error);
  const future = date > today;
  const dirty = body !== savedBody;
  const rebuild = Boolean(reply) && dirty;
  const advisor = replyAdvisorId ? getAdvisor(replyAdvisorId) : advisorId ? getAdvisor(advisorId) : null;
  const locked = sensitive;

  function insertChip(chip: string) {
    setBody((current) => {
      const next = current.trim() ? `${current.replace(/\s+$/u, "")}\n${chip}` : chip;
      return clipText(next, DIARY_BODY_LIMIT);
    });
  }

  async function onSave() {
    setPending(true);
    setMessage(null);
    setFormError(null);
    const result = await saveDiary(date, body);
    setPending(false);
    if (!result.ok) {
      setFormError(result.error ?? "保存できませんでした。");
      return;
    }
    setSavedBody(result.body ?? body);
    setReply(result.reply ?? null);
    setSensitive(result.sensitive ?? false);
    setShareReply(result.shareReply ?? true);
    if (result.advisorId && isAdvisorId(result.advisorId)) {
      setReplyAdvisorId(result.advisorId);
    }
    setMessage(result.message ?? null);
  }

  async function onShareReply(next: boolean) {
    if (locked) {
      return;
    }
    setShareReply(next);
    const saved = await setDiaryShareReply(date, next);
    if (!saved.ok) {
      setShareReply((current) => !current);
      setFormError(saved.error);
      return;
    }
    setShareReply(saved.shareReply);
    setSensitive(saved.locked);
  }

  return (
    <section className="mt-4 rounded-2xl bg-[#E7DCC8] p-4 sm:p-5" aria-label="今日のひとこと">
      <h3 className="text-sm font-medium text-[#F5821F]">今日のひとこと</h3>
      <p className="mt-2 text-xs leading-5 break-words text-zinc-700">{DIARY_PRIVACY_NOTICE}</p>
      {future ? (
        <p className="mt-3 text-sm leading-6 text-zinc-600">今日より先の日付には書けません。</p>
      ) : (
        <>
          <label className="mt-3 block">
            <span className="sr-only">今日のひとこと</span>
            <textarea
              value={body}
              onChange={(event) => setBody(clipText(event.target.value, DIARY_BODY_LIMIT))}
              maxLength={DIARY_BODY_LIMIT}
              rows={4}
              placeholder="今日あったこと、感じたことを自由に"
              className="w-full resize-y rounded-2xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 py-3 text-base leading-7 break-words text-zinc-900 outline-none"
            />
          </label>
          <p className="mt-1 text-right text-xs tabular-nums text-zinc-600">
            {textLength(body)}/{DIARY_BODY_LIMIT}
          </p>
          <fieldset className="mt-3">
            <legend className="text-sm font-medium text-zinc-800">書くのが面倒なとき</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SHARE_SITUATIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="min-h-11 rounded-full border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-sm text-zinc-800"
                  onClick={() => insertChip(item.text)}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#F5821F] px-4 text-sm font-medium text-white disabled:opacity-60"
            onClick={onSave}
            disabled={pending || !body.trim()}
          >
            {pending ? "保存しています…" : rebuild ? "保存して返事をもらい直す" : "保存して返事をもらう"}
          </button>
        </>
      )}
      {formError ? <p className="mt-3 text-sm leading-6 text-red-800">{formError}</p> : null}
      {message ? <p className="mt-3 text-sm leading-6 text-zinc-700">{message}</p> : null}
      {reply && advisor ? (
        <div className="mt-4 flex items-end gap-3">
          <img
            src={`/characters/${advisor.id}.svg`}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-2xl bg-[#FBF6EE]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#F5821F]">{advisor.name}</p>
            <div className="mt-1 rounded-2xl rounded-tl-md bg-[#FBF6EE] px-4 py-3">
              <p className="text-base leading-7 break-words text-zinc-900">{reply}</p>
            </div>
          </div>
        </div>
      ) : null}
      {reply ? (
        <label className="mt-3 flex min-h-11 items-start gap-3 text-sm leading-6 text-zinc-800">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-[#F5821F]"
            checked={!locked && shareReply}
            disabled={locked || future}
            onChange={(event) => onShareReply(event.target.checked)}
          />
          <span>
            この返事をシェアに載せる
            {locked ? <span className="mt-1 block text-xs text-zinc-600">この返事は、シェアに載せられません</span> : null}
          </span>
        </label>
      ) : null}
      {future ? null : <ShareCardButton date={date} />}
    </section>
  );
}
