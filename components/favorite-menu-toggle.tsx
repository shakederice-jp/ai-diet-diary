"use client";

import { useState, useTransition } from "react";
import { setFavoriteOnDay } from "@/app/days/[date]/actions";
import { RecordReaction } from "@/components/record-reaction";

export function FavoriteMenuToggle({
  date,
  favoriteId,
  checked,
  label,
}: {
  date: string;
  favoriteId: string;
  checked: boolean;
  label: string;
}) {
  const [on, setOn] = useState(checked);
  const [prevChecked, setPrevChecked] = useState(checked);
  const [reaction, setReaction] = useState<{ advisorName: string; line: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (checked !== prevChecked) {
    setPrevChecked(checked);
    setOn(checked);
  }

  return (
    <div className="min-w-0 flex-1">
      <label className="flex min-w-0 items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={on}
          disabled={pending}
          aria-label={label}
          className="size-4 accent-[#F5821F]"
          onChange={(event) => {
            const nextChecked = event.target.checked;
            setOn(nextChecked);
            startTransition(async () => {
              const result = await setFavoriteOnDay(date, favoriteId, nextChecked);
              setReaction(result?.reaction ?? null);
            });
          }}
        />
        <span className={pending ? "opacity-60" : undefined}>{label}</span>
      </label>
      <RecordReaction reaction={reaction} />
    </div>
  );
}
