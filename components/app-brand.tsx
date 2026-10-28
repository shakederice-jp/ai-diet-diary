import { APP_CATCHCOPY, APP_NAME, APP_SUBTITLE } from "@/lib/app-title";

const SIZES = {
  hero: {
    catch: "text-sm font-medium text-zinc-600 sm:text-base",
    name: "text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl",
    sub: "mt-1 text-sm font-normal leading-5 text-zinc-500",
  },
  plain: {
    catch: "text-xs font-medium text-[#8A7360] sm:text-sm",
    name: "text-lg font-semibold text-[#6B4A32] sm:text-xl",
    sub: "mt-0.5 text-xs leading-4 text-[#8A7360]",
  },
  label: {
    catch: "text-xs font-medium text-[#8A7360]",
    name: "text-base font-semibold text-[#6B4A32]",
    sub: "mt-0.5 text-[11px] leading-4 text-[#8A7360]",
  },
} as const;

export function AppBrand({
  heading = false,
  size = "plain",
}: {
  heading?: boolean;
  size?: keyof typeof SIZES;
}) {
  const tone = SIZES[size];
  const lockup = (
    <>
      <span className="flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-snug">
        <span className={`whitespace-nowrap ${tone.catch}`}>{APP_CATCHCOPY}</span>
        <span className={`whitespace-nowrap ${tone.name}`}>{APP_NAME}</span>
      </span>
      <span className={`block ${tone.sub}`}>{APP_SUBTITLE}</span>
    </>
  );

  if (heading) {
    return <h1 className="min-w-0">{lockup}</h1>;
  }

  return <div className="min-w-0">{lockup}</div>;
}
