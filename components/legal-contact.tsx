import { publicContactEmail } from "@/lib/site";

export function LegalContact() {
  const email = publicContactEmail();
  if (!email) {
    return (
      <p className="mt-3 text-sm leading-6 text-zinc-800">
        お問い合わせ用のメールアドレスは、掲載の準備ができ次第、このページに表示します。
      </p>
    );
  }
  return (
    <p className="mt-3 text-sm leading-6 text-zinc-800">
      お問い合わせ:{" "}
      <a
        href={`mailto:${email}`}
        className="text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 hover:text-[#E06E0C]"
      >
        {email}
      </a>
    </p>
  );
}
