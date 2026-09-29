import type { ReactNode } from "react";
import { AppNav, type AppSection } from "@/components/app-nav";

export function SettingsFrame({
  current,
  eyebrow,
  title,
  description,
  children,
}: {
  current: AppSection;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF8F3] px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <AppNav current={current} />
        <p className="mt-6 text-sm font-medium text-[#F5821F]">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
