import { ADVISORS, ADVISOR_DISCLAIMER } from "@/lib/advisors";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app-title";
import { MEMOLEVER_GUIDE_UPDATED_ON } from "@/lib/guide-meta";
import { OPERATOR_NAME } from "@/lib/site";

/**
 * メモレバ紹介LP（/guide）の文章。
 * ホームページの LANDING_FAQS は短い別文で、画面と JSON-LD が既にそれを読んでいる。
 * こちらは質問が違い、回答を「アプリ名は」で始める必要があるため、ガイド専用に持つ。
 * 事実関係は /privacy /terms /howto と揃える。
 */

export const GUIDE_PATH = "/guide";

export const GUIDE_UPDATED_ON = MEMOLEVER_GUIDE_UPDATED_ON;

export const GUIDE_TITLE = `${APP_NAME}｜AIがカロリーを計算！無料のダイエット手帳アプリ`;

export const GUIDE_DESCRIPTION =
  `食事名を入れるだけでAIがカロリーを推定。体重グラフ、週の上限、5人のAIアドバイザーで無理なく続けられる、無料の${APP_SUBTITLE}アプリ「${APP_NAME}」を紹介します。`;

export const GUIDE_DEFINITION =
  `${APP_NAME}は、食事名を入力するとAIがカロリーを推定し、体重とあわせて管理できる、無料の${APP_SUBTITLE}（Webアプリ）です。運営は${OPERATOR_NAME}です。`;

export const GUIDE_ABOUT_MORE = [
  "インストールしなくても、スマートフォンやパソコンのブラウザから使えます。ホーム画面に追加して、アプリのように開くこともできます。",
  "カロリーは食事名からの目安です。パッケージや店の表示で数字がわかるときは、その数字を自分で入れられます。",
  "体重は、その日のページへ手入力できます。タニタのHealth Planetを使っているときは、マイページから連携すると体重を取り込めます。",
  `食事を記録した日には、選んだAIアドバイザーから短いコメントが返ります。${ADVISOR_DISCLAIMER}`,
] as const;

export const GUIDE_AUDIENCE = [
  {
    title: "三日坊主になりがち",
    body: "毎日を完璧に残す前提ではありません。週の合計で見て、記録できなかった日には連続記録のおやすみもあります。",
  },
  {
    title: "カロリー計算が面倒",
    body: "食事名を入れると、AIが一般的な量の目安を出します。毎回、食品成分表を開いて計算しなくても記録を始められます。",
  },
  {
    title: "毎日きっちりが苦手",
    body: "カロリーの上限は、1日ごとに帳尻を合わせるのではなく、1週間の合計で調整する考え方です。",
  },
  {
    title: "体重計のデータもまとめたい",
    body: "手入力に加え、タニタのHealth Planetから体重を取り込めます。食事の記録と同じカレンダーで見られます。",
  },
  {
    title: "ひとりで続けるきっかけがほしい",
    body: "5人のAIアドバイザーと、今日のひとこと（日記）があります。コメントは一般的な情報です。",
  },
] as const;

export const GUIDE_FEATURE_IDS = [
  "meals",
  "health",
  "weight",
  "weekly",
  "advisor",
  "voice",
  "diary",
] as const;

export type GuideFeatureId = (typeof GUIDE_FEATURE_IDS)[number];

const advisorSentence = ADVISORS.map((advisor) => `${advisor.name}（${advisor.description}）`).join("、");

export const GUIDE_FEATURES: readonly {
  id: GuideFeatureId;
  title: string;
  body: string;
}[] = [
  {
    id: "meals",
    title: "AIのカロリー推定",
    body: "料理名を入れ、カロリーを空のまま記録すると、名前からAIが一般的な量を想定して目安を出します。記録には「AI推定」と出ます。自分で数字を入れると「手入力」になり、その数字が使われます。あとから編集もできます。",
  },
  {
    id: "health",
    title: "Health Planet連携",
    body: "タニタのHealth Planetと連携できます。マイページの「外部サービス連携」から「連携する」を押し、連携したあとにカレンダーを開くと体重が取り込まれます。取り込まれるのは体重だけです。食事、歩数、体脂肪は自動では入りません。連携した体重は、このアプリの画面では修正も削除もできません。",
  },
  {
    id: "weight",
    title: "カレンダーと日・週・月の体重グラフ",
    body: "ログイン後の最初の画面がカレンダーです。日付を開くとその日のページになり、食べたカロリーが見えます。グラフでは体重の線と、食べたカロリーの棒を、日・週・月の幅で見られます。",
  },
  {
    id: "weekly",
    title: "週の上限",
    body: "カロリーの上限は、食べ切る目標ではなく、収めるための上限です。まだ目標を保存していないときは、1週間で14,000kcalを仮の上限にしています。保存したあとは、プロフィールと目標から1日の上限と1週間の上限が出ます。少なくなりすぎないように、下限もあります。",
  },
  {
    id: "advisor",
    title: "5人のAIアドバイザー",
    body: `マイページで、話しかけ方を1人選んで「このアドバイザーを使う」を押します。${advisorSentence}。食事を記録した日のページに、短いコメントが出ます。${ADVISOR_DISCLAIMER}`,
  },
  {
    id: "voice",
    title: "音声入力とまとめて入力",
    body: "対応しているブラウザでは、時間帯ごとの欄にあるマイクから食事名を話せます。複数行を貼り付けると、品を分けて入れられます。最後に「まとめて登録」を押すと、カロリーが空の品はAIが推定し、数字を入れた品はその数字で残ります。音声データは、このアプリでは保存しません。",
  },
  {
    id: "diary",
    title: "日記と月のまとめ",
    body: "その日のページに「今日のひとこと」を残せます。月のまとめでは、週が上限の内側だったか、体重、日記をまとめて見られます。日ごとの集計と食事の明細はCSVで書き出せます。CSVはその場で作り、ファイルはサーバーに残しません。",
  },
];

export const GUIDE_STEPS = [
  {
    title: "入れる",
    body: "カレンダーの日付を開き、料理名を入れます。カロリーが空ならAIが推定します。わかる数字は、その欄に入れてから記録します。音声や、複数行の貼り付けも使えます。",
  },
  {
    title: "見る",
    body: "カレンダーでその日のカロリーを見ます。グラフで体重とカロリーの変化を見ます。今週の上限カードで、週の合計が上限の内側かを見ます。",
  },
  {
    title: "続ける",
    body: "アドバイザーのコメントや日記を、記録を開くきっかけにします。記録できない日は、連続記録のおやすみを選ぶこともできます。月のまとめとCSVで、あとから見返せます。",
  },
] as const;

export const GUIDE_WEEKLY = [
  "毎日を同じ量でそろえるのではなく、1週間の合計で見る考え方です。ある日が多くても、その日だけで記録をやめず、週の残りとあわせて見返せます。",
  `${APP_NAME}では、まだ目標を保存していないときの仮の上限は1週間14,000kcalです。画面の1日の数字は、週の上限を日で割った上限であり、食べ切る量ではありません。`,
  "これは記録の見方です。同じ上限でも、体格や生活で意味は変わります。効果や結果を約束するものではなく、医療上の助言でもありません。",
] as const;

export const GUIDE_RESOURCE_LINKS = [
  {
    href: "/eating-out" as const,
    blurb: "外食のランチや定食を、1食あたりのカロリーなどの目安で見られます。",
  },
  {
    href: "/sweets" as const,
    blurb: "包装されていない菓子やスイーツを、間食1回分のカロリーの目安で見られます。",
  },
  {
    href: "/staples" as const,
    blurb: "ご飯、パン、麺などの主食を、量ごとのカロリーで見られます。",
  },
] as const;

export const GUIDE_COMPARE_INTRO =
  "食事の記録アプリには、数字を自分で入れるものや、写真を残すものがあります。次の表は優劣ではなく、入力や体重の扱いの違いです。他のサービス名は出していません。";

export const GUIDE_COMPARE_COLUMNS = [
  "手入力だけの記録アプリ",
  "写真で記録するアプリ",
  APP_NAME,
] as const;

export const GUIDE_COMPARE_ROWS = [
  {
    topic: "入力の手軽さ",
    cells: [
      "料理名とカロリーを、自分で調べて入れることが多いです。",
      "食事の写真を撮って残すやり方です。撮影が主な入力になります。",
      "食事名を文字で入れます。対応ブラウザでは音声でも入れられ、複数の品をまとめて登録できます。",
    ],
  },
  {
    topic: "カロリーの算出方法",
    cells: [
      "本、パッケージ、店の表示を見て、数字を自分で入れます。",
      "写真から推定する仕組みを持つものがあります。推定の仕方はアプリによります。",
      "食事名からAIが一般的な量で推定します。わかる数字は、手入力に置き換えられます。",
    ],
  },
  {
    topic: "体重データの連携",
    cells: [
      "手入力が中心です。体重計との連携があるかは、アプリによります。",
      "体重の扱いもアプリによります。写真とは別に入れるものが多いです。",
      "手入力に加え、タニタのHealth Planetから体重を取り込めます。体脂肪は取り込みません。",
    ],
  },
  {
    topic: "続けるための工夫",
    cells: [
      "記録そのものが中心です。声かけや週単位の上限は、アプリによります。",
      "撮った写真を見返すことが、続ける手がかりになることがあります。",
      "週の上限、5人のAIアドバイザー、日記、連続記録のおやすみがあります。",
    ],
  },
  {
    topic: "料金",
    cells: [
      "無料のものと、有料の機能があるものがあります。",
      "無料のものと、有料の機能があるものがあります。",
      "現在は無料です。有料の商品・サービスの販売は行っていません。",
    ],
  },
] as const;

export const GUIDE_FAQS = [
  {
    question: "無料ですか",
    answer: `${APP_NAME}は、現在無料で使えます。有料の商品・サービスの販売は行っていません。`,
  },
  {
    question: "カロリーの精度はどのくらいですか",
    answer: `${APP_NAME}は、食事名からAIが一般的な量を想定してカロリーを推定します。実際の量、調理法、商品で変わる目安であり、計測値ではありません。正確な数字がわかるときは、自分で入力できます。`,
  },
  {
    question: "医療上のアドバイスはしてくれますか",
    answer: `${APP_NAME}は、医療上の助言を行うものではありません。AIアドバイザーのコメントは一般的な情報で、医師や管理栄養士による診断や指導ではありません。`,
  },
  {
    question: "体重計がなくても使えますか",
    answer: `${APP_NAME}は、体重計がなくても使えます。体重は手入力でき、食事の記録だけでも始められます。タニタの体重計は、Health Planetと連携するときだけ使います。`,
  },
  {
    question: "Health Planetとは何ですか",
    answer: `${APP_NAME}は、タニタのHealth Planetと連携できます。連携はマイページの「外部サービス連携」から「連携する」を押して行います。連携したあとは、カレンダーを開くと体重が取り込まれます。取り込まれるのは体重だけで、食事や歩数、体脂肪は自動では入りません。連携した体重は、このアプリの画面では修正も削除もできません。`,
  },
  {
    question: "データは安全ですか",
    answer: `${APP_NAME}は、食事や体重などの記録を、ログインした本人だけが読み書きできるよう制限しています。通信はHTTPSです。自分で作ったシェアカードは、リンクを知っている人が見られます。カードに載るのは、載せることを選んだ内容だけです。`,
  },
  {
    question: "音声入力はできますか",
    answer: `${APP_NAME}は、対応しているブラウザで食事名の音声入力ができます。音声データは${APP_NAME}では保存しません。音声は、ブラウザの音声認識により、ブラウザの提供会社の音声認識サービスに送られることがあります。使えないブラウザでは、キーボードから入力します。`,
  },
  {
    question: "スマホのホーム画面に追加できますか",
    answer: `${APP_NAME}は、ブラウザで使うWebアプリです。スマートフォンのホーム画面に追加できます。iPhoneでは、画面下の共有ボタンから「ホーム画面に追加」を選び、右上の「追加」を押します。ブラウザが追加を案内するときは、その案内にも従えます。`,
  },
  {
    question: "AIアドバイザーとは何ですか",
    answer: `${APP_NAME}のAIアドバイザーは、${advisorSentence}の5人です。マイページで1人を選びます。食事を記録した日に短いコメントが出ます。${ADVISOR_DISCLAIMER}`,
  },
  {
    question: "退会はできますか",
    answer: `${APP_NAME}は、アプリ内の機能では退会（アカウントの削除）ができません。希望するときは、お問い合わせのメールで依頼してください。食事、手入力の体重、歩数、シェアカードはアプリ内で削除できます。日記だけを消す機能はなく、Health Planetから入った体重はこの画面からは削除できません。`,
  },
] as const;

export const GUIDE_CAUTION =
  `効果や結果には個人差があります。${APP_NAME}は医療上の助言を行うものではありません。`;

export const GUIDE_SAMPLE_NOTE = "画面は一例です（サンプルデータ）";

/** 仮の週上限。lib/goals.ts の DEFAULT_WEEKLY_KCAL_GOAL（14_000）と同じ。 */
export const GUIDE_SAMPLE_WEEKLY_LIMIT = 14000;

export const GUIDE_SAMPLE_WEEKLY_TOTAL = 15200;

export const GUIDE_SAMPLE_MEALS = [
  {
    period: "朝食",
    items: [
      { name: "トースト", kcal: 180, source: "AI推定" },
      { name: "コーヒー", kcal: 100, source: "AI推定" },
    ],
  },
  {
    period: "昼食",
    items: [{ name: "親子丼", kcal: 720, source: "AI推定" }],
  },
  {
    period: "間食",
    items: [{ name: "りんご", kcal: 80, source: "手入力" }],
  },
] as const;

export const GUIDE_SAMPLE_CALENDAR = [
  { label: "月", kcal: 420, tone: "plain" },
  { label: "火", kcal: 510, tone: "plain" },
  { label: "水", kcal: 480, tone: "plain" },
  { label: "木", kcal: 2100, tone: "over" },
  { label: "金", kcal: 450, tone: "plain" },
  { label: "土", kcal: 600, tone: "plain" },
  { label: "日", kcal: 380, tone: "today" },
] as const;

/** 架空の28週。増減の成功例ではなく、狭い範囲の上下です。 */
export const GUIDE_SAMPLE_WEIGHTS = [
  63.4, 63.1, 63.5, 62.9, 63.2, 63.6, 63.0, 62.8, 63.3, 62.7, 63.1, 62.6, 62.9, 63.4, 62.5, 63.0, 62.8,
  62.4, 63.2, 62.7, 63.0, 62.6, 63.3, 62.9, 62.5, 63.1, 62.8, 63.0,
] as const;

export const GUIDE_SAMPLE_ADVISOR_ID = "kansai" as const;

export const GUIDE_SAMPLE_ADVISOR_TEXT =
  "今日の記録、残してくれてるんやね。合計は上限の内側やで。明日も無理せんでええよ。";

export const GUIDE_SAMPLE_HEALTH = [
  { when: "4月7日 朝", value: "63.1kg", source: "Health Planet" },
  { when: "4月6日 朝", value: "62.8kg", source: "Health Planet" },
  { when: "4月5日 夜", value: "63.0kg", source: "手入力" },
] as const;

export const GUIDE_SAMPLE_VOICE = {
  period: "朝食",
  name: "トースト、ブラックコーヒー",
  hint: "カロリーを空にすると、登録時にAIが推定します",
} as const;

export const GUIDE_SAMPLE_DIARY = {
  body: "昼は定食。夜は家でスープにした。",
  reply: "ひとこと、書いてくれてるんやね。自分のペースでええよ。",
  weeks: [
    { label: "1週目", total: 12800, within: true },
    { label: "2週目", total: 15200, within: false },
    { label: "3週目", total: 13200, within: true },
    { label: "4週目", total: 14000, within: true },
  ],
  weight: { first: "62.8kg", last: "63.0kg", min: "62.4kg", max: "63.6kg", change: "+0.2kg" },
} as const;

export const GUIDE_SAMPLE_LABELS: Record<GuideFeatureId, string> = {
  meals: "朝食はトースト180kcalとコーヒー100kcalで合計280kcal、昼食は親子丼720kcal、間食はりんご80kcalと出ている食事入力のサンプル",
  health: "Health Planetから取り込んだ体重63.1kgと62.8kg、手入力の63.0kgが並ぶサンプル",
  weight: "1週間のカレンダーと、28週分の体重が62.4kgから63.6kgの範囲で上下する折れ線のサンプル",
  weekly: "今週の合計15200kcalが、上限14000kcalを超えているバーのサンプル",
  advisor: "関西のおかんからの短い返信サンプル。合計は上限の内側、という内容",
  voice: "朝食の入力欄にトーストとブラックコーヒーと入り、マイクボタンがあるサンプル",
  diary: "今日のひとことと、月の週ごとの合計、体重の最初と最後を並べたサンプル",
};
