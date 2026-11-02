import { InstantLink } from "@/components/instant-link";

const primary =
  "inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#F27A1A] px-6 text-lg font-medium text-white hover:bg-[#E06E0C]";

const secondary =
  "inline-flex min-h-14 w-full items-center justify-center rounded-full border border-[#F27A1A] bg-[#FBF6EE] px-6 text-lg font-medium text-[#C65A0A] hover:bg-[#E7DCC8]";

export function GuideStartButton({ className = "" }: { className?: string }) {
  return (
    <InstantLink href="/signup" className={`${primary} ${className}`}>
      無料ではじめる
    </InstantLink>
  );
}

export function GuideHowtoButton({ className = "" }: { className?: string }) {
  return (
    <InstantLink href="/howto" className={`${secondary} ${className}`}>
      使い方を見る
    </InstantLink>
  );
}
