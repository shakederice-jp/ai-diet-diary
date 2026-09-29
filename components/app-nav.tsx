import Link from "next/link";

const ITEMS = [
  { id: "home", href: "/", label: "カレンダー" },
  { id: "settings", href: "/settings", label: "プロフィール" },
  { id: "goals", href: "/goals", label: "目標設定" },
] as const;

export type AppSection = (typeof ITEMS)[number]["id"];

export function AppNav({ current }: { current: AppSection }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="画面">
      {ITEMS.map((item) => {
        const selected = item.id === current;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={
              selected
                ? "rounded-full bg-[#F5821F] px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-[#F5821F] px-3 py-1.5 text-sm font-medium text-[#F5821F] hover:bg-[#FFF4EB]"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
