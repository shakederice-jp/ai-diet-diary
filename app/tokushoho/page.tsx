import type { ReactNode } from "react";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/app-title";
import { LEGAL_PAGES } from "@/lib/legal";
import {
  OPERATOR_ADDRESS,
  OPERATOR_ADDRESS_NOTE,
  OPERATOR_NAME,
  OPERATOR_REPRESENTATIVE,
  SITE_URL,
  pageMetadata,
  publicContactEmail,
} from "@/lib/site";

const page = LEGAL_PAGES[2];

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: page.href,
  index: true,
  absoluteTitle: true,
});

const linkClass = "text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4 break-all";

export default function TokushohoPage() {
  const email = publicContactEmail();
  const rows: { label: string; value: ReactNode }[] = [
    { label: "販売事業者", value: OPERATOR_NAME },
    { label: "運営統括責任者", value: OPERATOR_REPRESENTATIVE },
    {
      label: "所在地",
      value: (
        <>
          <span className="block">{OPERATOR_ADDRESS}</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-600">{OPERATOR_ADDRESS_NOTE}</span>
        </>
      ),
    },
    { label: "電話番号", value: "請求があった場合、遅滞なく開示します" },
    {
      label: "メールアドレス",
      value: email ? (
        <a href={`mailto:${email}`} className={linkClass}>
          {email}
        </a>
      ) : (
        "メールアドレスは、掲載の準備ができ次第、この欄に表示します。"
      ),
    },
    {
      label: "販売URL",
      value: (
        <a href={SITE_URL} className={linkClass}>
          {SITE_URL}
        </a>
      ),
    },
    { label: "販売価格", value: "現在、有料の提供はありません" },
    { label: "支払方法", value: "現在、有料の提供はありません" },
    { label: "引渡時期", value: "現在、有料の提供はありません" },
    { label: "返品", value: "現在、有料の提供はありません" },
  ];

  return (
    <LegalPage href="/tokushoho">
      <p className="text-sm leading-6 text-zinc-800">
        現在、{APP_NAME}では有料の商品・サービスの販売を行っていません。有料のサービスを提供する場合は、このページに必要な事項を表示します。
      </p>
      <table className="w-full table-fixed text-sm leading-6 text-zinc-800">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-[#E4D7C6]">
              <th scope="row" className="w-[38%] py-3 pr-3 text-left align-top font-medium break-words text-[#6B4A32]">
                {row.label}
              </th>
              <td className="py-3 align-top break-words">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs leading-5 text-zinc-500">このページの記載は、有料サービスの開始時に見直します。</p>
    </LegalPage>
  );
}
