"use client";

import { useEffect, useState, useTransition } from "react";
import { setFavoriteOnDay } from "@/app/days/[date]/actions";

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
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOn(checked);
  }, [checked]);

  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
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
            await setFavoriteOnDay(date, favoriteId, nextChecked);
          });
        }}
      />
      <span className={pending ? "opacity-60" : undefined}>{label}</span>
    </label>
  );
}
