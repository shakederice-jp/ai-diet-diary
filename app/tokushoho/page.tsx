import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/app-title";
import { LEGAL_PAGES } from "@/lib/legal";
import { OPERATOR_NAME, pageMetadata, publicContactEmail } from "@/lib/site";

const page = LEGAL_PAGES[2];

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: page.href,
  index: true,
  absoluteTitle: true,
});

const rows = [
  ["運営者", OPERATOR_NAME],
  ["運営統括責任者", "請求があった場合、遅滞なく開示します"],
  ["所在地", "請求があった場合、遅滞なく開示します"],
  ["電話番号", "請求があった場合、遅滞なく開示します"],
  ["販売価格", "現在、有料の提供はありません"],
  ["支払方法", "現在、有料の提供はありません"],
  ["引渡時期", "現在、有料の提供はありません"],
  ["返品", "現在、有料の提供はありません"],
] as const;

export default function TokushohoPage() {
  const email = publicContactEmail();
  return (
    <LegalPage href="/tokushoho">
      <p className="text-sm leading-6 text-zinc-800">
        現在、{APP_NAME}では有料の商品・サービスの販売を行っていません。有料のサービスを提供する場合は、このページに必要な事項を表示します。
      </p>
      <table className="w-full table-fixed text-sm leading-6 text-zinc-800">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-[#E4D7C6]">
              <th scope="row" className="w-[38%] py-3 pr-3 text-left align-top font-medium text-[#6B4A32]">
                {label}
              </th>
              <td className="py-3 align-top break-words">{value}</td>
            </tr>
          ))}
          <tr className="border-t border-[#E4D7C6]">
            <th scope="row" className="w-[38%] py-3 pr-3 text-left align-top font-medium text-[#6B4A32]">
              お問い合わせ
            </th>
            <td className="py-3 align-top break-words">
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4"
                >
                  {email}
                </a>
              ) : (
                "メールアドレスは、掲載の準備ができ次第、この欄に表示します。"
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs leading-5 text-zinc-500">このページの記載は、有料サービスの開始時に見直します。</p>
    </LegalPage>
  );
}
