/** 主食の早見。kcal は 100g あたりの値と量から四捨五入する。 */

export const STAPLES_TITLE = "主食のカロリー早見表(ご飯・パン・麺)";

export const STAPLES_PAGE_TITLE = "ご飯・パン・麺のカロリー早見表｜メモレバ";

export const STAPLES_PAGE_HEADING = "ご飯・パン・麺のカロリー早見表";

export const STAPLES_SUMMARY =
  "ご飯・パン・麺など主食のカロリーを、量ごとに早見表にしました。ご飯を減らしたとき、麺を大盛りにしたときの差も分かります。";

export const STAPLES_DESCRIPTION =
  "ご飯、食パン、ラーメン・うどん・そば・パスタの麺など、主食のカロリーを量ごとに一覧にしました。ご飯を減らしたとき、麺を大盛りにしたときのカロリーの差も分かります。";

export const STAPLES_NOTICE =
  "文部科学省 日本食品標準成分表(八訂)増補2023年をもとにした目安です。1杯・1枚・1玉の量(g)は一般的な目安で、店や商品によって変わります。";

/** 文部科学省 日本食品標準成分表(八訂)増補2023年。100gあたりのkcal。 */
export const STAPLE_KCAL_PER_100G = {
  ご飯: 156,
  玄米ご飯: 152,
  食パン: 248,
  ロールパン: 309,
  フランスパン: 289,
  ナン: 257,
  もち: 223,
  おにぎり: 170,
  中華めん: 133,
  うどん: 95,
  そば: 130,
  スパゲッティ: 150,
  そうめん: 114,
} as const;

export type StapleFood = keyof typeof STAPLE_KCAL_PER_100G;

export function stapleKcal(food: StapleFood, grams: number) {
  return Math.round((STAPLE_KCAL_PER_100G[food] * grams) / 100);
}

/** 量の差を四捨五入する。四捨五入済みのkcalを引き算すると、0.5kcalが消える。 */
export function stapleKcalChange(food: StapleFood, fromGrams: number, toGrams: number) {
  return Math.round((STAPLE_KCAL_PER_100G[food] * (toGrams - fromGrams)) / 100);
}

export type StapleAmountRow = {
  label: string;
  amount: string;
  kcal: number;
  note?: string;
};

export type StapleNoodleRow = {
  label: string;
  regularGrams: number;
  regularKcal: number;
  largeGrams: number;
  largeKcal: number;
  deltaKcal: number;
};

const RICE_PORTIONS = [
  ["お茶碗 小盛", 100],
  ["お茶碗 普通", 150],
  ["お茶碗 大盛", 200],
  ["丼のご飯(並盛くらい)", 250],
  ["丼のご飯(やや多め)", 300],
  ["カレーライスのご飯(少なめ)", 200],
  ["カレーライスのご飯(標準)", 300],
] as const;

export const RICE_ROWS: readonly StapleAmountRow[] = RICE_PORTIONS.map(([label, grams]) => ({
  label,
  amount: `${grams}g`,
  kcal: stapleKcal("ご飯", grams),
}));

const riceSave50 = stapleKcal("ご飯", 50);
const riceSave100 = stapleKcal("ご飯", 100);

export const RICE_NOTE = `ご飯は、50g減らすと約${riceSave50}kcal、100g減らすと約${riceSave100}kcal減ります。`;

const BREAD_PORTIONS = [
  ["食パン 4枚切", 90, "食パン"],
  ["食パン 6枚切", 60, "食パン"],
  ["食パン 8枚切", 45, "食パン"],
  ["ロールパン 1個", 30, "ロールパン"],
  ["バゲット 1切れ", 30, "フランスパン"],
] as const;

export const BREAD_ROWS: readonly StapleAmountRow[] = BREAD_PORTIONS.map(([label, grams, food]) => ({
  label,
  amount: `約${grams}g`,
  kcal: stapleKcal(food, grams),
}));

const slice4 = stapleKcal("食パン", 90);
const slice6 = stapleKcal("食パン", 60);
const slice8 = stapleKcal("食パン", 45);
const toSix = slice4 - slice6;
const toEight = slice6 - slice8;

export const BREAD_NOTE = `4枚切を6枚切にすると約${toSix}kcal、6枚切を8枚切にすると約${toEight}kcal減ります。`;

const NOODLE_PORTIONS = [
  ["ラーメン(中華めん)", "中華めん", 230],
  ["うどん", "うどん", 250],
  ["そば", "そば", 200],
  ["パスタ", "スパゲッティ", 240],
] as const;

export const NOODLE_ROWS: readonly StapleNoodleRow[] = NOODLE_PORTIONS.map(([label, food, grams]) => {
  const largeGrams = grams * 1.5;
  return {
    label,
    regularGrams: grams,
    regularKcal: stapleKcal(food, grams),
    largeGrams,
    largeKcal: stapleKcal(food, largeGrams),
    deltaKcal: stapleKcalChange(food, grams, largeGrams),
  };
});

const pastaGrams = NOODLE_ROWS.find((row) => row.label === "パスタ")?.regularGrams;

export const PASTA_NOTE = `パスタ${pastaGrams}gは、乾麺100gをゆでた量の目安です。`;

const brownGrams = 150;
const whiteAtBrown = stapleKcal("ご飯", brownGrams);

export const OTHER_ROWS: readonly StapleAmountRow[] = [
  {
    label: "玄米ご飯",
    amount: `${brownGrams}g`,
    kcal: stapleKcal("玄米ご飯", brownGrams),
    note: `白米${brownGrams}gは${whiteAtBrown}kcal`,
  },
  {
    label: "お餅 1個",
    amount: "約50g",
    kcal: stapleKcal("もち", 50),
  },
  {
    label: "おにぎり 1個（具なしの目安）",
    amount: "約100g",
    kcal: stapleKcal("おにぎり", 100),
  },
  {
    label: "ナン 1枚",
    amount: "100〜150g",
    kcal: stapleKcal("ナン", 100),
  },
  {
    label: "そうめん ゆで",
    amount: "250g",
    kcal: stapleKcal("そうめん", 250),
  },
];

export function otherKcalLabel(row: StapleAmountRow) {
  if (row.label === "ナン 1枚") {
    return `${stapleKcal("ナン", 100)}〜${stapleKcal("ナン", 150)}`;
  }
  return String(row.kcal);
}
