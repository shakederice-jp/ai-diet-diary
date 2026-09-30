"use client";

import { useEffect, useState, useTransition } from "react";
import { setRankingVisible } from "@/app/mypage/actions";

export function RankingSwitch({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  return (
    <div className="mt-3">
      <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-900">
        <input
          type="checkbox"
          checked={enabled}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.checked;
            setEnabled(next);
            setError(null);
            startTransition(async () => {
              const result = await setRankingVisible(next);
              if (result.error) {
                setEnabled(!next);
                setError(result.error);
              }
            });
          }}
          className="size-5 accent-[#F5821F]"
        />
        他の人との比較を表示する
      </label>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
