import type { ReactNode } from "react";
import { GUIDE_SAMPLE_NOTE } from "@/lib/guide-lp";

export function SampleFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="mt-4 overflow-hidden rounded-2xl border border-[#E4D7C6] bg-[#FBF6EE]">
      <div role="img" aria-label={label}>
        <div
          className="flex items-center justify-between gap-3 border-b border-[#E4D7C6] px-4 py-2"
          aria-hidden="true"
        >
          <span className="text-xs font-medium text-[#8A7360]">サンプル</span>
          <span className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#FFB05A] to-[#F27A1A]" />
        </div>
        <div className="p-4" aria-hidden="true">
          {children}
        </div>
      </div>
      <figcaption className="border-t border-[#E4D7C6] px-4 py-2 text-[11px] leading-5 text-[#8A7360]">
        {GUIDE_SAMPLE_NOTE}
      </figcaption>
    </figure>
  );
}
