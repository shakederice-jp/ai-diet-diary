import type { ReactNode } from "react";
import { AppBrand } from "@/components/app-brand";

export function AuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-md rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <AppBrand size="label" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
