/** 外食ランチの固定データ。印は幅の真ん中から計算する。数字はここにだけ書く。 */

export const EATING_OUT_TITLE = "外食ランチ・定食のカロリー目安";

export const EATING_OUT_LEAD =
  "外食でよく選ばれる定食や丼、麺類などについて、カロリー・たんぱく質・野菜の量の目安をまとめました。選ぶときの参考にしてください。";

export const EATING_OUT_UPDATED = "2026年10月";

export const EATING_OUT_MARK_LEAD =
  "カロリー・たんぱく質・野菜の印は、それぞれの目安の真ん中の数字で、◎が多い(または低い)、○がふつう、△が少ない(または高い)の目安です。";

export const EATING_OUT_MARK_SCALE = [
  { label: "カロリー", text: "◎650kcal以下 / ○651〜850kcal / △851kcal以上" },
  { label: "たんぱく質", text: "◎30g以上 / ○20〜29g / △20g未満" },
  { label: "野菜", text: "◎120g以上 / ○70〜119g / △70g未満" },
] as const;

export const EATING_OUT_VEGETABLE_NOTE =
  "野菜は、いも類・豆類・きのこ類・海藻類・薬味を含まない量です。";

export const EATING_OUT_DISCLAIMER =
  "掲載の数値は、各チェーン店などが公表している栄養成分や、文部科学省の日本食品標準成分表をもとにした目安で、一部は推定です。店や量、ご飯の量によって変わります。*は、公式の栄養成分で確認できた数値を含みます。";

export const EATING_OUT_EMPTY = "該当するメニューはありません";

export const EATING_OUT_BALANCED_LABEL = "バランス良し";

export const EATING_OUT_GENRES = [
  "和食",
  "丼もの",
  "洋食",
  "中華",
  "麺類",
  "イタリアン",
  "弁当",
  "その他",
] as const;

export type EatingOutGenre = (typeof EATING_OUT_GENRES)[number];

/** ジャンル見出しの括弧。丼は並盛、麺はスープ込みの目安。 */
export const EATING_OUT_GENRE_NOTE: Partial<Record<EatingOutGenre, string>> = {
  丼もの: "並盛",
  麺類: "スープ込み",
};

export const EATING_OUT_SORTS = [
  { id: "standard", label: "標準の並び" },
  { id: "calorie", label: "カロリーが低い順" },
  { id: "protein", label: "たんぱく質が多い順" },
  { id: "vegetable", label: "野菜が多い順" },
] as const;

export type EatingOutSort = (typeof EATING_OUT_SORTS)[number]["id"];

export type EatingOutMark = "◎" | "○" | "△";

export type EatingOutRange = readonly [number, number];

export type EatingOutDish = {
  genre: EatingOutGenre;
  name: string;
  calorie: EatingOutRange;
  protein: EatingOutRange;
  vegetable: EatingOutRange;
  proteinOfficial: boolean;
  vegetableOfficial: boolean;
  note: string;
  comment: string;
};

const SECTIONS: Array<{ genre: EatingOutGenre; lines: readonly string[] }> = [
  {
    genre: "和食",
    lines: [
      "焼き魚定食|600-870|24-32|50-120|N|N||ご飯を少なめにし、味噌汁は具だくさんに。サバやホッケは脂が多め。",
      "刺身定食|500-700|25-36|40-110|N|N||脂が控えめでたんぱく質がとれる。小鉢の野菜も食べるとさらにバランス良く。",
      "煮魚定食|620-740|22-33|40-100|N|N||煮汁は糖分と塩分が多め。汁を残すと控えめに。",
      "生姜焼き定食|720-830|24-34|90-190|N|N||たれは糖分が多め。付け合わせのキャベツを先に食べる。",
      "肉じゃが定食|550-750|16-26|90-170|N|N||甘みがあるので、ご飯は少なめでも満足しやすい。",
      "和風おろしハンバーグ定食|750-910|25-34|110-200|N|N||大根おろしでさっぱり。ソースは少なめでも十分。",
      "天ぷら定食|670-820|20-28|90-170|N|N||衣が油を吸うので、食べる数で調整。塩で食べると控えめに。",
      "唐揚げ定食|850-1050|25-38|70-140|N|N||個数で大きく変わる。レモンだけで食べ、キャベツを足す。",
      "とんかつ定食|850-1050|30-40|120-220|N|N||ヒレなら控えめ。衣や脂身を少し残す手も。",
      "にぎり寿司(8〜10貫)|350-650|24-38|0-30|N|N||魚のたんぱく質はとれるが、野菜は少なめ。味噌汁やサラダを足す。",
    ],
  },
  {
    genre: "丼もの",
    lines: [
      "牛丼|630-710|17-22|30-70|Y|N||並盛が基準。つゆだくは避け、サラダや味噌汁を足す。",
      "親子丼|620-790|22-30|30-60|N|N||卵と鶏でたんぱく質がとれる。ご飯を少なめにしやすい。",
      "カツ丼|740-950|28-38|30-60|N|N||揚げ物と卵とじとご飯の組み合わせ。ご飯を少なめにすると調整しやすい。",
      "天丼|660-810|15-24|30-70|N|N||衣とたれで高め。ご飯を少なめにするか、サラダを足す。",
      "海鮮丼|570-820|24-35|5-30|N|N||ご飯の量がカギ。ネギトロなど脂の多いネタは多め。",
      "豚丼|580-720|14-24|0-30|Y|N||脂身とたれに注意。野菜の小鉢を足す。",
      "中華丼|650-800|18-28|100-170|N|N||野菜が多め。とろみに糖質と油があるので、汁気は残す。",
      "天津飯|650-900|25-33|0-30|N|N||卵の油とあんの糖質で高め。野菜の副菜を足す。",
    ],
  },
  {
    genre: "洋食",
    lines: [
      "カレーライス|700-850|15-22|60-120|N|N||ライスの量で変わる。サラダを足し、ご飯は少なめも。",
      "カツカレー|950-1150|28-40|60-120|N|N||揚げ物とルーで高め。ご飯少なめ、カツは半分にするなど。",
      "デミグラスハンバーグ定食|740-880|30-42|100-180|N|N||ソースと付け合わせのポテトで増える。ポテトは残す手も。",
      "チキンソテー定食|700-850|32-42|100-180|N|N||皮を残すと控えめ。たんぱく質がとれる。",
      "ビーフステーキ定食|600-950|33-46|100-180|N|N||赤身ならたんぱく質が豊富。ソースとバターは控えめに。",
      "エビフライ定食|650-900|22-32|80-150|N|N||タルタルは少なめに。千切りキャベツを先に。",
      "白身魚のフライ定食|600-850|20-29|80-150|N|N||魚でも揚げ物。衣を少し外すと控えめに。",
      "コロッケ定食|700-900|15-22|80-150|N|N||たんぱく質は少なめ。サラダや汁物で足す。",
      "オムライス|650-900|20-30|30-100|N|N||ライスと卵・バターで高め。サラダを足して、ゆっくり食べる。",
      "ミックスグリル|950-1150|35-50|80-150|N|N||肉の種類が多く脂質が高め。ご飯少なめか、1品残す。",
    ],
  },
  {
    genre: "中華",
    lines: [
      "八宝菜定食|580-800|20-30|170-280|N|N||野菜が豊富で、えびや肉でたんぱく質もとれる。とろみの汁は残す。",
      "レバニラ炒め定食|650-950|20-28|140-260|N|N||たんぱく質と野菜がとれる。炒め油は残す。",
      "青椒肉絲定食|650-930|17-26|130-240|N|N||ピーマンとたけのこで野菜が多め。油が多めなので汁は残す。",
      "肉野菜炒め定食|650-980|15-24|200-320|N|N||野菜はたっぷり。たんぱく質は少なめなので、卵や豆腐を足す。",
      "麻婆豆腐定食|750-1100|20-32|0-40|N|N||油と辛味噌が多め。汁を飲みすぎない。野菜の小鉢を足す。",
      "回鍋肉定食|730-980|15-25|160-280|N|N||キャベツは多いが、豚バラの脂と甜麺醤に注意。ご飯は少なめに。",
      "エビチリ定食|580-800|23-33|20-80|N|N||ソースの糖分と油で増える。野菜の副菜を足す。",
      "餃子定食(5〜6個)|520-690|15-23|40-90|N|N||個数で調整。焼き餃子は油が増える。野菜スープを足す。",
      "酢豚定食|680-950|19-29|100-190|N|N||揚げ物と甘酢の組み合わせで高め。ご飯を少なめに。",
      "油淋鶏定食|680-950|25-38|60-120|N|N||たんぱく質は豊富。たれは少なめに。",
      "チャーハン(単品)|450-740|12-21|0-30|N|N||油とご飯で高め。たんぱく質は少なめ。スープや野菜を足す。",
    ],
  },
  {
    genre: "麺類",
    lines: [
      "醤油ラーメン|600-800|20-30|0-40|Y|N||スープを残すと塩分と脂が減る。ほうれん草やメンマを足す。",
      "とんこつラーメン|650-900|20-32|0-30|N|N||背脂やスープの濃さで増える。スープは残す。",
      "味噌ラーメン|800-950|25-35|50-150|Y|N||スープの塩分と脂質が高め。野菜増しがおすすめ。",
      "つけ麺|750-950|24-38|0-30|N|N||麺の量が多くなりやすい。麺は並盛にする。",
      "冷やし中華|480-700|17-28|60-110|N|N||比較的軽め。卵や鶏肉のトッピングでたんぱく質を足す。",
      "ちゃんぽん|590-760|22-32|150-255|Y|Y||野菜が多い。スープは残すと塩分が減る。",
      "焼きそば|550-800|18-27|100-200|N|N||野菜はそこそこ。卵や肉を足してたんぱく質を補う。",
      "ラーメン+半チャーハン|900-1250|28-41|0-50|N|N||糖質と脂質が重なる。半チャーハンを野菜に替えるだけでも差が出る。",
      "きつねうどん|400-690|11-18|0-15|N|N|小〜中サイズの幅|軽めだが、たんぱく質と野菜は少なめ。サラダを足す。",
      "ざるそば|340-450|10-15|0-5|N|N||軽め。たんぱく質と野菜が少なめなので、卵・野菜天・サラダを足す。",
      "天ぷらそば|530-700|17-25|0-50|N|N||えび天などでたんぱく質がとれる。かき揚げは油が多め。",
      "カレーうどん|520-870|14-22|40-80|N|N|小〜中サイズの幅|汁にルーが入り高め。汁は残す。",
    ],
  },
  {
    genre: "イタリアン",
    lines: [
      "ナポリタン|600-850|18-24|60-100|N|N||ケチャップの糖分と油で増える。サラダを足す。",
      "ミートソース|540-700|20-28|80-150|N|N||肉と野菜が入っていて、バランスは良め。粉チーズは少なめに。",
      "カルボナーラ|610-810|22-32|0-20|N|N||チーズ・卵・ベーコンで高め。野菜がないので、サラダを足す。",
      "トマトソースのパスタ|450-650|14-20|80-200|N|N||野菜が多めで比較的軽い。たんぱく質は少なめなので、卵やチキンを足す。",
      "ペペロンチーノ|520-650|13-17|0-20|N|N||軽めだが、たんぱく質も野菜も少ない。サラダとチキンを足す。",
      "ピザ(マルゲリータ、1人用)|550-720|23-33|40-90|N|N||シンプルな種類が控えめ。サラダを足して、枚数を調整。",
      "ミラノ風ドリア|520-610|12-22|30-60|N|N||量は控えめでも、たんぱく質と野菜が少ない。サラダやスープを足す。",
    ],
  },
  {
    genre: "弁当",
    lines: [
      "幕の内弁当|650-850|21-24|30-80|Y|N|ご飯の量(ミニ〜中盛)の幅。並盛は約730kcal|品数が多く調整しやすい。揚げ物は1つ残す手も。",
      "のり弁当|610-760|19-21|0-20|Y|N|ご飯の量(ミニ〜中盛)の幅。並盛は約690kcal|揚げ物とご飯が中心で野菜が少ない。サラダを足す。",
      "唐揚げ弁当|590-850|28-33|10-40|Y|N|4コ入りで並盛は約660kcal。6コ入りは高め|たんぱく質は豊富だが揚げ物。野菜のサラダを足す。",
      "焼き鮭弁当|510-650|20-22|0-20|Y|N|ご飯の量(ミニ〜中盛)の幅。並盛は約580kcal|比較的軽め。野菜の副菜を足す。",
      "焼肉弁当|590-740|17-19|10-50|Y|N|ご飯の量(ミニ〜中盛)の幅。並盛は約660kcal|たれとご飯の量で変わる。野菜を足す。",
      "とんかつ弁当|710-850|24-27|30-70|Y|N|ご飯の量(ミニ〜中盛)の幅。並盛は約780kcal|揚げ物とご飯。ご飯は少なめにして、キャベツは追加で。",
      "ハンバーグ弁当|700-950|20-30|20-60|N|N||ソースとご飯で高め。野菜の副菜を足す。",
      "チキン南蛮弁当|740-890|24-26|20-50|Y|N|ご飯の量(ミニ〜中盛)の幅。並盛は約815kcal|揚げ物とタルタルで高め。タルタルは少なめに。",
    ],
  },
  {
    genre: "その他",
    lines: [
      "焼肉定食(カルビ・ロース)|750-1000|25-38|40-100|N|N||脂の多い部位は高め。ロースやハラミなら控えめ。サンチュやサラダを足す。",
      "石焼きビビンバ|550-800|15-25|80-150|N|N||ナムルで野菜がとれる。ご飯は少なめにして、よく混ぜる。",
      "ハンバーガーセット(バーガー・ポテトM・ドリンク)|750-1150|21-38|10-30|Y|N||ポテトとドリンクで増える。ドリンクを無糖にするとさらに控えめに。",
      "サンドイッチ(ミックスサンド)|250-400|10-18|20-50|N|N||軽いが、たんぱく質と野菜は少なめ。ゆで卵やサラダを足す。",
      "おにぎり2個(コンビニ)|340-480|9-13|0-5|Y|N||軽いが、たんぱく質と野菜は少なめ。味噌汁・サラダチキン・サラダを足す。",
      "スンドゥブチゲ定食|550-800|25-40|50-120|N|N||豆腐と野菜が中心。塩分が高めなので汁は残す。",
      "バターチキンカレー+ナン|700-1100|22-32|20-60|N|N||バターとクリームの脂質、ナンの糖質で高め。ナンは半分にする手も。",
      "ガパオライス|550-800|22-30|40-120|Y|N||ひき肉と野菜。目玉焼きで脂質が増える。ご飯は少なめに。",
    ],
  },
];

function parseRange(value: string, line: string): EatingOutRange {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) {
    throw new Error(`幅の形式が違います: ${line}`);
  }
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (min > max) {
    throw new Error(`下限が上限を超えています: ${line}`);
  }
  return [min, max];
}

function parseFlag(value: string, line: string) {
  if (value !== "Y" && value !== "N") {
    throw new Error(`公式の印は Y か N です: ${line}`);
  }
  return value === "Y";
}

function parseDish(genre: EatingOutGenre, line: string): EatingOutDish {
  const parts = line.split("|");
  if (parts.length !== 8) {
    throw new Error(`列の数が違います: ${line}`);
  }
  const [name, calorie, protein, vegetable, proteinOfficial, vegetableOfficial, note, comment] = parts;
  if (!name || !comment) {
    throw new Error(`名前かひとことが空です: ${line}`);
  }
  return {
    genre,
    name,
    calorie: parseRange(calorie, line),
    protein: parseRange(protein, line),
    vegetable: parseRange(vegetable, line),
    proteinOfficial: parseFlag(proteinOfficial, line),
    vegetableOfficial: parseFlag(vegetableOfficial, line),
    note,
    comment,
  };
}

export const EATING_OUT_DISHES: readonly EatingOutDish[] = SECTIONS.flatMap((section) =>
  section.lines.map((line) => parseDish(section.genre, line)),
);

export function rangeMidpoint(range: EatingOutRange) {
  return (range[0] + range[1]) / 2;
}

export function calorieMark(range: EatingOutRange): EatingOutMark {
  const midpoint = rangeMidpoint(range);
  if (midpoint <= 650) {
    return "◎";
  }
  if (midpoint <= 850) {
    return "○";
  }
  return "△";
}

export function proteinMark(range: EatingOutRange): EatingOutMark {
  const midpoint = rangeMidpoint(range);
  if (midpoint >= 30) {
    return "◎";
  }
  if (midpoint >= 20) {
    return "○";
  }
  return "△";
}

export function vegetableMark(range: EatingOutRange): EatingOutMark {
  const midpoint = rangeMidpoint(range);
  if (midpoint >= 120) {
    return "◎";
  }
  if (midpoint >= 70) {
    return "○";
  }
  return "△";
}

export function isBalancedDish(dish: EatingOutDish) {
  return (
    calorieMark(dish.calorie) !== "△" &&
    proteinMark(dish.protein) !== "△" &&
    vegetableMark(dish.vegetable) !== "△"
  );
}

export function formatEatingOutRange(range: EatingOutRange, unit: string, official = false) {
  return `${range[0]}〜${range[1]}${unit}${official ? "*" : ""}`;
}

export function eatingOutGenreLabel(genre: EatingOutGenre) {
  const note = EATING_OUT_GENRE_NOTE[genre];
  return note ? `${genre}（${note}）` : genre;
}

export function filterEatingOutDishes(
  dishes: readonly EatingOutDish[],
  options: {
    genre: EatingOutGenre | "すべて";
    balancedOnly: boolean;
    sort: EatingOutSort;
  },
) {
  const indexed = dishes.map((dish, index) => ({ dish, index }));
  const filtered = indexed.filter(({ dish }) => {
    if (options.genre !== "すべて" && dish.genre !== options.genre) {
      return false;
    }
    if (options.balancedOnly && !isBalancedDish(dish)) {
      return false;
    }
    return true;
  });
  const midpointOf = (dish: EatingOutDish) => {
    if (options.sort === "calorie") {
      return rangeMidpoint(dish.calorie);
    }
    if (options.sort === "protein") {
      return rangeMidpoint(dish.protein);
    }
    if (options.sort === "vegetable") {
      return rangeMidpoint(dish.vegetable);
    }
    return 0;
  };
  filtered.sort((a, b) => {
    if (options.sort === "standard") {
      return a.index - b.index;
    }
    const direction = options.sort === "calorie" ? 1 : -1;
    const diff = (midpointOf(a.dish) - midpointOf(b.dish)) * direction;
    if (diff !== 0) {
      return diff;
    }
    return a.index - b.index;
  });
  return filtered.map(({ dish }) => dish);
}
