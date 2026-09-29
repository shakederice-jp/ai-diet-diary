import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "マイページ | AI Diet Diary",
};

const filledLink =
  "inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C]";
const outlineLink =
  "inline-flex h-12 items-center justify-center rounded-full border border-[#F5821F] bg-[#FBF6EE] px-6 text-sm font-medium text-[#F5821F] hover:bg-[#E7DCC8]";

export default function MyPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF8F3] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-medium text-[#F5821F]">
          カレンダーに戻る
        </Link>
        <p className="mt-6 text-sm font-medium text-[#F5821F]">マイページ</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">設定</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          プロフィールと目標カロリーをここから開きます。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/settings" className={filledLink}>
            プロフィール
          </Link>
          <Link href="/goals" className={outlineLink}>
            目標設定
          </Link>
        </div>
      </main>
    </div>
  );
}
