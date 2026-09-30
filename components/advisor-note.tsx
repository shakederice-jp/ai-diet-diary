import Link from "next/link";
import { ADVISOR_DISCLAIMER, getAdvisor } from "@/lib/advisors";
import type { AdvisorCommentView } from "@/lib/advisor-comment";

export function AdvisorNote({ view }: { view: AdvisorCommentView }) {
  const advisorName = advisorNameOf(view);

  return (
    <section className="mt-4 rounded-2xl bg-[#E7DCC8] p-5" aria-label="健康アドバイザーAI">
      <p className="text-sm font-medium text-[#F5821F]">健康アドバイザーAI</p>
      {advisorName ? <p className="mt-1 text-xs font-medium text-zinc-700">{advisorName}</p> : null}
      <AdvisorBody view={view} />
      <p className="mt-3 text-xs leading-5 text-zinc-600">{ADVISOR_DISCLAIMER}</p>
    </section>
  );
}

function advisorNameOf(view: AdvisorCommentView) {
  if (view.kind === "empty" || view.kind === "comment") {
    return getAdvisor(view.advisorId).name;
  }
  return null;
}

function AdvisorBody({ view }: { view: AdvisorCommentView }) {
  if (view.kind === "choose") {
    return (
      <p className="mt-3 text-sm leading-6 text-zinc-800">
        マイページでアドバイザーを選ぶと、この日の食事へのコメントが表示されます。
        <Link href="/mypage" className="ml-2 font-medium text-[#F5821F]">
          マイページへ
        </Link>
      </p>
    );
  }

  if (view.kind === "error") {
    return <p className="mt-3 text-sm leading-6 text-red-800">{view.message}</p>;
  }

  return <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-zinc-800">{view.text}</p>;
}
