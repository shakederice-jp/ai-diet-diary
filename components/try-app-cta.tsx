import { InstantLink } from "@/components/instant-link";

export function TryAppCta({
  href,
  className = "",
}: {
  href: "/" | "/signup";
  className?: string;
}) {
  return (
    <p className={`text-[13px] leading-5 text-zinc-700 ${className}`}>
      食事を記録して、AIアドバイザーに相談する →{" "}
      <InstantLink
        href={href}
        className="inline-flex min-h-8 items-center text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
      >
        メモレバを使ってみる
      </InstantLink>
    </p>
  );
}
