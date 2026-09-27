import Link from "next/link";
import { notFound } from "next/navigation";
import { formatJapaneseDate, formatMonthParam, parseIsoDate } from "@/lib/calendar";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsed = parseIsoDate(date);
  if (!parsed) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF8F3] px-6 py-16 dark:bg-black">
      <main className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <p className="text-sm font-medium text-[#F5821F]">食事記録</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {formatJapaneseDate(parsed.date)}
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          この日の記録画面はまだ準備中です。
        </p>
        <Link
          href={`/?month=${formatMonthParam(parsed.year, parsed.month)}`}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C]"
        >
          カレンダーに戻る
        </Link>
      </main>
    </div>
  );
}
