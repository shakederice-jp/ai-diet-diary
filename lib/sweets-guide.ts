/** お菓子・スイーツの固定データ。印は1回分のkcalの真ん中から計算する。数字はここにだけ書く。 */

export const SWEETS_TITLE = "お菓子・スイーツのカロリー目安";

export const SWEETS_PAGE_TITLE = "お菓子・スイーツのカロリー目安一覧｜メモレバ";

export const SWEETS_DESCRIPTION =
  "米菓・クッキー・和菓子・ケーキ・菓子パン・ナッツなど、包装されていないお菓子とスイーツ102品の、間食1回分のカロリーの目安を一覧にしました。";

export const SWEETS_NOTICE =
  "コンビニやスーパーで売られている市販のお菓子は、パッケージの栄養成分表示でカロリーをご確認ください。このページは、包装されていない菓子・スイーツや、種類ごとの目安をまとめたものです。";

export const SWEETS_LEAD =
  "間食1回分のカロリーの目安です。印は1回分の目安の真ん中の数字で判定しています。推定を含みます。";

export const SWEETS_SNACK_NOTE =
  "間食の目安は1日200kcal程度とされています(食事バランスガイドより)。";

export const SWEETS_MARK_SCALE = "◎ 100kcal以下 / ○ 101〜200kcal / △ 201kcal以上";

export const SWEETS_DISCLAIMER =
  "掲載の数値は、文部科学省の日本食品標準成分表(八訂)をもとにした目安で、一部は推定です。大きさ、作り方、お店によって変わります。1個・1枚の重さは一般的な目安です。";

export const SWEETS_PACKAGE_NOTE =
  "市販のパッケージ入りのお菓子は、パッケージの栄養成分表示をご確認ください。";

export const SWEETS_EMPTY = "該当するメニューはありません";

export const SWEETS_GENRES = [
  "米菓",
  "クッキー類",
  "和菓子",
  "ケーキ",
  "焼き菓子・カフェ",
  "菓子パン",
  "ナッツ・いも",
] as const;

export type SweetsGenre = (typeof SWEETS_GENRES)[number];

export type SweetsMark = "◎" | "○" | "△";

export type SweetsBasis = "成" | "推";

export type SweetsRange = readonly [number, number];

export type SweetsSort = "standard" | "calorie";

export type SweetsMarkFilter = "すべて" | "◎だけ" | "◎と○";

export type SweetsItem = {
  genre: SweetsGenre;
  name: string;
  piece: string;
  serving: string;
  kcal: SweetsRange;
  basis: SweetsBasis;
  note: string;
};

const SECTIONS: Array<{ genre: SweetsGenre; lines: readonly string[] }> = [
  {
    genre: "米菓",
    lines: [
      "しょうゆせんべい|1枚 55〜110kcal|2〜3枚|110-220|成|",
      "塩せんべい|1枚 35〜75kcal|2〜3枚|75-165|推|",
      "ざらめせんべい|1枚 55〜95kcal|2枚|110-185|推|",
      "堅焼きせんべい|1枚 55〜90kcal|2枚|110-185|推|",
      "揚げせんべい|1枚 35〜70kcal|3〜4枚|115-205|成|",
      "南部せんべい|1枚 35〜65kcal|2枚|70-125|推|",
      "瓦せんべい|1枚 40〜90kcal|2〜3枚|85-205|推|",
      "のり巻きせんべい|1枚 30〜55kcal|3〜4枚|90-165|推|",
      "えびせんべい|1枚 20〜45kcal|25〜40g|90-185|推|",
      "おかき|1個 15〜30kcal|3〜4個|55-115|成|",
      "あられ|10gあたり 約38kcal|20〜30g|75-115|成|",
      "揚げもち|1個 15〜25kcal|20〜30g|90-135|推|",
      "柿の種|1粒 7〜11kcal|20〜30g|75-115|推|",
    ],
  },
  {
    genre: "クッキー類",
    lines: [
      "プレーンクッキー|1枚 35〜60kcal|3枚|100-185|推|",
      "バタークッキー|1枚 35〜60kcal|3枚|100-185|推|",
      "チョコチップクッキー|1枚 45〜75kcal|2枚|110-205|推|",
      "ソフトクッキー|1枚 50〜100kcal|2枚|100-205|成|",
      "サブレ|1枚 45〜85kcal|3枚|140-250|成|",
      "ラングドシャ|1枚 20〜40kcal|3枚|55-125|推|",
      "全粒粉ビスケット|1枚 35〜75kcal|3枚|100-230|推|",
      "ハードビスケット(マリー系)|1枚 20〜35kcal|5〜6枚|105-205|成|",
      "ウエハース|1枚 15〜35kcal|4〜5枚|70-155|成|",
      "クラッカー|1枚 15〜25kcal|5〜8枚|65-190|成|",
      "塩クラッカー|1枚 15〜25kcal|5〜8枚|65-190|成|",
      "パイ(パイ菓子)|1枚 85〜140kcal|1〜2枚|85-225|成|",
    ],
  },
  {
    genre: "和菓子",
    lines: [
      "豆大福|1個 155〜235kcal|1個|155-235|成|",
      "いちご大福|1個 125〜175kcal|1個|125-175|推|",
      "草餅|1個 110〜180kcal|1個|110-180|成|",
      "柏餅|1個 140〜205kcal|1個|140-205|成|",
      "桜餅|1個 95〜175kcal|1個|95-175|成|",
      "おはぎ|1個 155〜230kcal|1個|155-230|成|",
      "みたらし団子|1串 115〜175kcal|1串|115-175|成|",
      "三色団子|1串 115〜160kcal|1串|115-160|推|",
      "わらび餅|1人前 100〜205kcal|1人前|100-205|推|",
      "どら焼き|1個 175〜265kcal|1個|175-265|成|",
      "今川焼(大判焼)|1個 175〜260kcal|1個|175-260|成|",
      "たい焼き|1個 180〜245kcal|1個|180-245|成|",
      "最中|1個 85〜150kcal|1個|85-150|成|",
      "きんつば|1個 130〜210kcal|1個|130-210|成|",
      "酒饅頭|1個 100〜160kcal|1個|100-160|推|",
      "薄皮饅頭|1個 65〜115kcal|2個|125-235|推|",
      "練り切り|1個 105〜155kcal|1個|105-155|成|",
      "栗きんとん|1個 80〜175kcal|1個|80-175|推|根拠が弱い目安",
      "羊羹|1切れ 115〜175kcal|1切れ|115-175|成|",
    ],
  },
  {
    genre: "ケーキ",
    lines: [
      "ショートケーキ|1個 240〜360kcal|1個|240-360|成|",
      "ベイクドチーズケーキ|1切れ 200〜335kcal|1切れ|200-335|成|",
      "レアチーズケーキ|1個 280〜420kcal|1個|280-420|成|",
      "ガトーショコラ|1切れ 215〜320kcal|1切れ|215-320|推|",
      "モンブラン|1個 275〜415kcal|1個|275-415|推|",
      "ティラミス|1個 245〜380kcal|1個|245-380|推|",
      "ミルクレープ|1切れ 250〜350kcal|1切れ|250-350|推|根拠が弱い目安",
      "ミルフィーユ|1個 205〜280kcal|1個|205-280|推|",
      "シュークリーム|1個 110〜185kcal|1個|110-185|成|",
      "エクレア|1個 160〜230kcal|1個|160-230|成|",
      "ロールケーキ|1切れ 125〜200kcal|1切れ|125-200|成|",
      "シフォンケーキ|1切れ 110〜165kcal|1切れ|110-165|推|",
      "フルーツタルト|1個 205〜290kcal|1個|205-290|推|",
      "レモンタルト|1切れ 240〜320kcal|1切れ|240-320|推|",
      "パウンドケーキ|1切れ 160〜240kcal|1切れ|160-240|成|",
      "スフレ(チーズスフレ)|1切れ 200〜250kcal|1切れ|200-250|推|",
    ],
  },
  {
    genre: "焼き菓子・カフェ",
    lines: [
      "マドレーヌ|1個 100〜180kcal|1個|100-180|成|",
      "フィナンシェ|1個 110〜165kcal|1個|110-165|成|",
      "カヌレ|1個 100〜200kcal|1個|100-200|推|",
      "バウムクーヘン|1切れ 105〜225kcal|1切れ|105-225|成|",
      "ドーナツ(オールドファッション)|1個 220〜330kcal|1個|220-330|成|",
      "ドーナツ(砂糖がけ)|1個 190〜300kcal|1個|190-300|成|",
      "ドーナツ(チョコがけ)|1個 210〜340kcal|1個|210-340|推|",
      "ドーナツ(リング型・モチ系)|1個 170〜250kcal|1個|170-250|推|",
      "スコーン|1個 155〜275kcal|1個|155-275|成|",
      "マフィン|1個 150〜305kcal|1個|150-305|成|",
      "ワッフル|1個 190〜350kcal|1個|190-350|成|",
      "パンケーキ|1枚 160〜315kcal|1枚|160-315|成|",
      "クレープ|1個 320〜570kcal|1個|320-570|成|",
      "生チョコ|1個 40〜75kcal|1個|40-75|成|",
      "トリュフチョコ|1個 50〜85kcal|1個|50-85|推|",
      "ソフトクリーム(コーン)|1個 165〜260kcal|1個|165-260|成|コーン分は推定",
      "かき氷(シロップ・練乳)|1杯 40〜250kcal|1杯|40-250|推|練乳やあずきで増える",
      "カスタードプリン|1個 105〜180kcal|1個|105-180|成|",
      "パフェ|1杯 350〜700kcal|1杯|350-700|推|盛りで大きく変わる",
    ],
  },
  {
    genre: "菓子パン",
    lines: [
      "あんぱん|1個 180〜260kcal|1個|180-260|成|",
      "クリームパン|1個 145〜220kcal|1個|145-220|成|",
      "メロンパン|1個 225〜320kcal|1個|225-320|成|",
      "チョココロネ|1個 190〜340kcal|1個|190-340|推|",
      "ジャムパン|1個 190〜240kcal|1個|190-240|成|",
      "クロワッサン|1個 155〜220kcal|1個|155-220|成|",
      "デニッシュ|1個 170〜285kcal|1個|170-285|成|",
      "シナモンロール|1個 195〜370kcal|1個|195-370|成|",
      "揚げパン|1個 260〜405kcal|1個|260-405|成|",
    ],
  },
  {
    genre: "ナッツ・いも",
    lines: [
      "アーモンド|1粒 約6kcal|10粒|60-75|成|素焼きは少し高め",
      "ピーナッツ|1粒 約3〜5kcal|10粒|30-55|成|素焼きは少し高め。粒の大きさで差",
      "ピスタチオ(殻なし)|1粒 約3〜4kcal|10粒|30-40|成|",
      "カシューナッツ|1粒 約10kcal|10粒|90-120|成|",
      "マカダミアナッツ|1粒 8〜15kcal|10粒|115-150|成|",
      "ミックスナッツ|1粒 約9〜14kcal|10粒|90-140|推|配合で変わる",
      "くるみ(半割り)|1片 21〜29kcal|10片|210-285|成|",
      "甘栗(むき実)|1粒 10〜14kcal|10粒|105-145|成|",
      "レーズン|1粒 約2kcal|10粒|15-25|成|",
      "ドライプルーン|1個 17〜25kcal|2個|35-50|成|",
      "ドライマンゴー|1切れ(約10g) 30〜35kcal|3切れ|90-105|推|",
      "干し芋|10gあたり 約28kcal|1枚(約40g)|100-120|成|",
      "焼き芋|10gあたり 約15kcal|1本(180〜250g)|270-380|成|",
      "大学芋|10gあたり 約23kcal|1人前(80〜120g)|180-270|成|",
    ],
  },
];

function parseLine(genre: SweetsGenre, line: string): SweetsItem {
  const [name, piece, serving, kcal, basis, note = ""] = line.split("|");
  const [minText, maxText] = kcal.split("-");
  const min = Number(minText);
  const max = Number(maxText);
  if (!name || !piece || !serving || !Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new Error(`不正なお菓子データ: ${line}`);
  }
  if (basis !== "成" && basis !== "推") {
    throw new Error(`根拠が不正: ${line}`);
  }
  return { genre, name, piece, serving, kcal: [min, max], basis, note };
}

export const SWEETS_ITEMS: readonly SweetsItem[] = SECTIONS.flatMap((section) =>
  section.lines.map((line) => parseLine(section.genre, line)),
);

export function sweetsMidpoint(range: SweetsRange) {
  return (range[0] + range[1]) / 2;
}

export function sweetsMark(range: SweetsRange): SweetsMark {
  const midpoint = sweetsMidpoint(range);
  if (midpoint <= 100) {
    return "◎";
  }
  if (midpoint <= 200) {
    return "○";
  }
  return "△";
}

export function sweetsBasisLabel(basis: SweetsBasis) {
  return basis === "成" ? "成分表をもとにした計算" : "推定";
}

export function filterSweetsItems(
  items: readonly SweetsItem[],
  options: {
    genre: SweetsGenre | "すべて";
    mark: SweetsMarkFilter;
    sort: SweetsSort;
  },
) {
  const indexed = items.map((item, index) => ({ item, index }));
  const filtered = indexed.filter(({ item }) => {
    if (options.genre !== "すべて" && item.genre !== options.genre) {
      return false;
    }
    const mark = sweetsMark(item.kcal);
    if (options.mark === "◎だけ" && mark !== "◎") {
      return false;
    }
    if (options.mark === "◎と○" && mark === "△") {
      return false;
    }
    return true;
  });
  filtered.sort((a, b) => {
    if (options.sort === "standard") {
      return a.index - b.index;
    }
    const diff = sweetsMidpoint(a.item.kcal) - sweetsMidpoint(b.item.kcal);
    if (diff !== 0) {
      return diff;
    }
    return a.index - b.index;
  });
  return filtered.map(({ item }) => item);
}
