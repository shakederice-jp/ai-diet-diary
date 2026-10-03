export function PageSkeleton({
  title,
  wide = false,
}: {
  title: string;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main
        className={`w-full rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8 ${wide ? "max-w-4xl" : "max-w-2xl"}`}
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-[#F5821F]">{title}</p>
        <div className="mt-4 h-8 w-48 animate-pulse rounded-lg bg-[#E7DCC8]" />
        <div className="mt-6 h-28 animate-pulse rounded-2xl bg-[#E7DCC8]" />
        <div className="mt-4 h-16 animate-pulse rounded-2xl bg-[#E7DCC8]" />
        <p className="mt-4 text-sm text-zinc-600">読み込んでいます…</p>
      </main>
    </div>
  );
}
