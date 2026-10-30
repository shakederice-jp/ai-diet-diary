import { LegalContact } from "@/components/legal-contact";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL_PAGES } from "@/lib/legal";
import { APP_NAME, OPERATOR_NAME, pageMetadata } from "@/lib/site";

const page = LEGAL_PAGES[1];

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: page.href,
  index: true,
  absoluteTitle: true,
});

export default function TermsPage() {
  return (
    <LegalPage href="/terms">
      <LegalSection number={1} title="適用">
        <p>
          この規約は、{OPERATOR_NAME}が提供する{APP_NAME}の利用条件を定めるものです。登録して利用する人に適用されます。
        </p>
      </LegalSection>
      <LegalSection number={2} title="利用登録">
        <p>登録には、メールアドレスとパスワードを使います。虚偽の内容で登録してはいけません。</p>
      </LegalSection>
      <LegalSection number={3} title="アカウントの管理">
        <p>メールアドレスとパスワードの管理は、登録した人の責任です。アカウントを第三者に貸してはいけません。</p>
      </LegalSection>
      <LegalSection number={4} title="料金">
        <p>現在は、無料で利用できます。有料にする場合は、事前に知らせます。</p>
      </LegalSection>
      <LegalSection number={5} title="禁止事項">
        <p>次の行為をしてはいけません。</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>法令または公序良俗に反すること</li>
          <li>他人になりすますこと</li>
          <li>不正アクセス</li>
          <li>サービスの運営を妨げること</li>
          <li>自動化による大量のアクセス</li>
          <li>他人の個人情報を登録すること</li>
          <li>その他、運営が不適切と判断する行為</li>
        </ul>
      </LegalSection>
      <LegalSection number={6} title="健康情報・AIの内容に関する注意">
        <p>
          このサービスの目安と AI の助言は、一般的な情報です。診断、治療、医療上の助言ではありません。持病がある方、服薬中の方、妊娠中の方などは、医師や専門家に相談してください。
        </p>
        <p>効果や結果には個人差があります。カロリーなどの数値は目安であり、正確であることを保証しません。</p>
      </LegalSection>
      <LegalSection number={7} title="外部サービスとの連携">
        <p>Health Planet など外部サービスの利用条件には、その事業者の規約が適用されます。</p>
      </LegalSection>
      <LegalSection number={8} title="サービスの変更・中断・終了">
        <p>サービスの内容の変更、中断、終了を、予告なく行うことがあります。</p>
      </LegalSection>
      <LegalSection number={9} title="利用の停止・退会">
        <p>規約に反する場合、利用を止めることがあります。退会（アカウントの削除）は、アプリ内の機能では行えません。希望するときは、お問い合わせのメールで依頼してください。</p>
        <LegalContact />
      </LegalSection>
      <LegalSection number={10} title="免責">
        <p>
          法令で認められる範囲で、このサービスの利用によって生じた損害の責任を負いません。ただし、事業者に故意または重大な過失がある場合を除きます。
        </p>
      </LegalSection>
      <LegalSection number={11} title="規約の変更">
        <p>規約を変更することがあります。変更後の規約は、このページに掲載した時点から効力を生じます。</p>
      </LegalSection>
      <LegalSection number={12} title="準拠法・管轄">
        <p>この規約は、日本法に従います。紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
      </LegalSection>
    </LegalPage>
  );
}
