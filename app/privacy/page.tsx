import { LegalContact } from "@/components/legal-contact";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL_PAGES } from "@/lib/legal";
import {
  OPERATOR_ADDRESS,
  OPERATOR_ADDRESS_NOTE,
  OPERATOR_NAME,
  OPERATOR_REPRESENTATIVE,
  pageMetadata,
} from "@/lib/site";

const page = LEGAL_PAGES[0];

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: page.href,
  index: true,
  absoluteTitle: true,
});

export default function PrivacyPage() {
  return (
    <LegalPage href="/privacy">
      <LegalSection number={1} title="事業者">
        <p>このサービスの事業者は、{OPERATOR_NAME}です。</p>
        <p>運営統括責任者は、{OPERATOR_REPRESENTATIVE}です。</p>
        <p>
          所在地は、{OPERATOR_ADDRESS}です。
          <br />
          {OPERATOR_ADDRESS_NOTE}
        </p>
        <LegalContact />
      </LegalSection>
      <LegalSection number={2} title="取得する情報">
        <p>このサービスは、次の情報を取得し、保存します。体重、食事、身体の記録など、健康に関する記録を含みます。</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>アカウント: メールアドレス、パスワード。パスワードは認証の仕組みで保管し、画面には表示しません。</li>
          <li>プロフィール: 身長、生年月日、性別、ふだんの動き。</li>
          <li>目標: 現在の体重、目標の体重、期間、計算したカロリーの目安。</li>
          <li>食事: 日付、料理名、カロリー、時間帯、外食・内食・中食の別、手入力か推定か、よく使うメニュー。</li>
          <li>体重: 測定日時、体重、記録の出所（手入力または Health Planet）、機器の型式。</li>
          <li>歩数: 日付、歩数、距離。</li>
          <li>AIの記録: 選んだアドバイザー、生成したコメント、自炊メニューの提案。</li>
          <li>継続と表示の設定: 連続記録、おやすみの使用、好感度、他の人との比較を出すかどうか、体重グラフの縦軸。</li>
          <li>
            シェアカード: 短い文章、キャラクター、任意で連続日数と体重の表示。リンクを知っている人が見られます。公開するカード自体には、利用者のIDを置きません。
          </li>
          <li>
            Health Planet 連携: アクセストークン、リフレッシュトークン、有効期限、許可の範囲、最後に同期した日時。許可の範囲には体重、血圧、歩数が含まれます。このサービスが取得して保存するのは、そのうち体重（測定日時、体重、機器の型式）です。
          </li>
        </ul>
      </LegalSection>
      <LegalSection number={3} title="利用目的">
        <p>取得した情報は、次の目的で使います。</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>サービスの提供</li>
          <li>本人確認と認証</li>
          <li>記録の表示とグラフ</li>
          <li>AIアドバイスの作成</li>
          <li>問い合わせへの対応</li>
          <li>不具合の調査と改善</li>
          <li>規約違反への対応</li>
        </ul>
      </LegalSection>
      <LegalSection number={4} title="AI機能での取り扱い">
        <p>
          カロリーの推定と料理の分類には、料理名を送ります。アドバイザーのコメントには、日付、その日の食事の名前・カロリー・時間帯・外食などの別、その日のカロリーの上限、過去に生成したコメントを送ります。自炊メニューの提案には、直近の食事の名前とカロリー、カロリーの上限、日付を送ります。メールアドレスは送っていません。
        </p>
        <p>AIの回答は、一般的な情報です。医師や管理栄養士による診断、治療、医療上の助言ではありません。</p>
      </LegalSection>
      <LegalSection number={5} title="外部サービスへの委託・提供">
        <p>サービスの運営のため、次の事業者に情報の取り扱いを委託し、または連携します。</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Supabase: データの保存とログイン。本番のデータベースは東京リージョンです。</li>
          <li>Vercel: このサイトの配信。関数の実行リージョンは東京（hnd1）です。Vercel は海外の事業者を含みます。</li>
          <li>Anthropic: AIの文章生成。海外の事業者を含みます。</li>
          <li>Health Planet（タニタ）: 利用者が連携したとき、体重の取得と連携のためのトークンの交換。日本のサービスです。</li>
        </ul>
        <p>これらの委託は、個人情報の保護に関する法律に沿って行います。</p>
      </LegalSection>
      <LegalSection number={6} title="第三者への提供">
        <p>法令に基づく場合などを除き、本人の同意なく、個人情報を第三者に提供しません。</p>
        <p>利用者が作ったシェアカードは、リンクを知っている人が見られます。体重を載せるかは、作るときに選べます。</p>
      </LegalSection>
      <LegalSection number={7} title="Cookie・解析ツール">
        <p>
          アクセス解析や広告のための Cookie は使用していません。ログイン状態の維持、週の始まりの設定、Health Planet 連携の確認のために Cookie を使用します。
        </p>
      </LegalSection>
      <LegalSection number={8} title="安全管理">
        <p>通信は HTTPS で行います。保存した記録は、ログインした本人に限って読み書きできるよう、アクセスを制限しています。</p>
      </LegalSection>
      <LegalSection number={9} title="保管期間と削除">
        <p>
          食事、手入力の体重、歩数、シェアカードは、アプリ内で削除できます。Health Planet から入った体重は、このアプリの画面からは削除できません。アカウント自体を消す機能は、アプリ内にはありません。削除を希望するときは、お問い合わせのメールで依頼してください。
        </p>
      </LegalSection>
      <LegalSection number={10} title="開示・訂正・利用停止の請求">
        <p>自分の個人情報の開示、訂正、利用停止は、お問い合わせのメールで受け付けます。</p>
      </LegalSection>
      <LegalSection number={11} title="将来の広告・アフィリエイト">
        <p>現在、広告やアフィリエイトリンクは出していません。</p>
        <p>
          将来導入する場合は、広告であることを明示します。その配信事業者が情報を取得する場合は、このポリシーを改定します。
        </p>
      </LegalSection>
      <LegalSection number={12} title="改定">
        <p>このポリシーを改定したときは、このページに掲載し、ページ上部の日付を更新します。</p>
      </LegalSection>
    </LegalPage>
  );
}
