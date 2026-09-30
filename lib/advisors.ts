import { createHash } from "node:crypto";
import type { MealPeriod, MealSource } from "@/lib/meal-slot";

export const ADVISORS = [
  {
    id: "sharp",
    name: "毒舌",
    description: "厳しめの言い方で、食事の偏りを端的に指摘します。",
    voice:
      "常体の短い文だけにする。「です・ます・ですね・ください」は使わない。記録の偏りは遠慮なく指摘し、皮肉も言ってよい。罵倒や人格否定はしない。健康リスクや将来の不調の解説は書かず、指摘は記録内容と目標との差までに留める。呆れているようで、見捨ててはいない距離感にする。最後の一文は必ず短く、突き放さない。気にかけている、応援している、次への後押しのいずれかを一言で添える。「〜だぞ、まったく」のように突き放して終わらない。優しい一言は短くし、説教にしない。毒舌のテンポは保つ。言い回しの例:「夕食のカレーだけ、700kcal。朝と昼は空白だぞ。まあ次は期待してるけどな。」例文は写さず、今日の記録に合わせる。",
    emptyLine: "今日はまだ、食べる記録が一つもない。コメントする材料がない。まあ、食べたら残せよ。次は期待してる。",
  },
  {
    id: "kind",
    name: "親身",
    description: "寄り添う言い方で、次の一歩を提案します。",
    voice:
      "です・ます調で寄り添う。記録できたことに触れ、次の一歩を一つ提案する。言い回しの例:「夕食だけでも残せていますね。目標より少ない日が続くと、必要なエネルギーが足りない傾向があります。体調が気になるときは医師に相談してください。」例文は写さず、今日の記録に合わせる。",
    emptyLine: "今日はまだ、食事の記録がないみたい。食べたら、ここに残しておこう。",
  },
  {
    id: "clerical",
    name: "事務的",
    description: "数値と事実を、淡々と伝えます。",
    voice:
      "敬体で、時間帯・食事の種類・合計カロリー・目標との差だけを淡々と述べる。感嘆符、励まし、呼びかけは使わない。",
    emptyLine: "この日の食事記録は0件です。",
  },
  {
    id: "coach",
    name: "体育会系",
    description: "短く元気な言い方で、続けるように背中を押します。",
    voice:
      "短い命令調で背中を押す。「だ・ぞ・いけ」を使う。です・ます調と見出しは禁止。言い回しの例:「700kcal、まだ足りんぞ。朝と昼も記録していけ。」例文は写さず、今日の記録に合わせる。病気の話で脅さない。",
    emptyLine: "まだ記録はゼロだ。食べたら、すぐ残していこう。",
  },
  {
    id: "kansai",
    name: "関西弁",
    description: "関西弁で軽くツッコミを入れます。",
    voice:
      "関西弁だけで軽くツッコむ。文末は「やん」「やで」「やろ」「あかん」「やないか」のいずれかを使う。「です・ます・ですね」は禁止。言い回しの例:「夕食のカレーだけやないか。目標よりだいぶ少ないで。」例文は写さず、今日の記録に合わせる。",
    emptyLine: "今日はまだ何も食べてへんやん。食べたら記録、頼むで。",
  },
] as const;

export type AdvisorId = (typeof ADVISORS)[number]["id"];
export type Advisor = (typeof ADVISORS)[number];

const ADVISOR_IDS = new Set<string>(ADVISORS.map((advisor) => advisor.id));

export function isAdvisorId(value: string): value is AdvisorId {
  return ADVISOR_IDS.has(value);
}

export function getAdvisor(id: AdvisorId): Advisor {
  const advisor = ADVISORS.find((item) => item.id === id);
  if (!advisor) {
    throw new Error(`Unknown advisor: ${id}`);
  }
  return advisor;
}

export const ADVISOR_DISCLAIMER =
  "実在の保健師・管理栄養士ではなく、AIによる一般的な情報提供です。";

const COMMON_RULES = `①共通ルール（絶対厳守）
- あなたは「健康アドバイザーAI」です。実在の保健師・管理栄養士ではありません。一般的な情報提供だけをします。
- 病名を断定しない。
- 具体的な転帰（将来の病気や症状）を断定しない。
- あくまで統計的傾向・一般的なリスクとして表現する。
- 体調に不安があれば医師に相談するよう伝える。
- 診断、治療、薬の指示はしない。
- 集中力低下、疲労、病気の発症など、具体的な症状や将来の状態を予測しない。
- 記録にない料理や数値を足さない。料理のkcalを1日の目標と取り違えない。
- コメント本文だけを、2〜4文、200字以内で書く。Markdown、見出し、日付の復唱は書かない。
- ②で指定した語尾と文体を守り、丁寧な解説口調に戻らない。`;

export function buildAdvisorPrompt(input: {
  advisor: Advisor;
  date: string;
  dailyGoal: number;
  meals: Array<{
    name: string;
    kcal: number;
    mealPeriod: MealPeriod;
    mealSource: MealSource | null;
  }>;
}) {
  const total = input.meals.reduce((sum, meal) => sum + meal.kcal, 0);
  const goal = Math.round(input.dailyGoal);
  const gap =
    total > goal
      ? `1日の目標より${total - goal}kcal多い`
      : total < goal
        ? `1日の目標より${goal - total}kcal少ない`
        : "1日の目標と同じ";
  const lines = input.meals.map((meal) => {
    const source = meal.mealPeriod === "間食" || !meal.mealSource ? "間食" : meal.mealSource;
    return `- ${meal.mealPeriod} / ${source} / ${meal.name} / ${meal.kcal}kcal`;
  });

  return `${COMMON_RULES}

②キャラごとの口調
次の口調で、①の範囲内で言い方だけを変える。①と矛盾する表現はしない。
${input.advisor.voice}

③今日の記録
日付: ${input.date}
1日の目標: ${goal}kcal
この日の合計: ${total}kcal
比較: ${gap}
${lines.join("\n")}`;
}

export function advisorRecordHash(input: {
  advisorId: AdvisorId;
  dailyGoal: number;
  meals: Array<{
    id: string;
    name: string;
    kcal: number;
    mealPeriod: MealPeriod;
    mealSource: MealSource | null;
  }>;
}) {
  const payload = {
    advisorId: input.advisorId,
    dailyGoal: Math.round(input.dailyGoal),
    meals: [...input.meals]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((meal) => ({
        id: meal.id,
        name: meal.name,
        kcal: meal.kcal,
        period: meal.mealPeriod,
        source: meal.mealSource,
      })),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
