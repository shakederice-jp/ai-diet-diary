// 使い方: npx tsx scripts/render-guide-og.tsx path/to/NotoSansJP-Medium.otf
// フォントは Noto Sans JP（OFL）。リポジトリには入れず、生成した PNG だけを public/og に置く。
// 取得例: https://github.com/notofonts/noto-cjk の Sans/SubsetOTF/JP/NotoSansJP-Medium.otf
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";

const fontPath = process.argv[2];
if (!fontPath) {
  throw new Error("font path required");
}
const font = readFileSync(fontPath);

const pages = [
  {
    file: "eating-out.png",
    lines: ["外食ランチ・定食の", "カロリー目安"],
    lead: "1食あたりのカロリー・たんぱく質・野菜",
  },
  {
    file: "sweets.png",
    lines: ["お菓子・スイーツの", "カロリー目安"],
    lead: "間食1回分のカロリーの目安",
  },
  {
    file: "staples.png",
    lines: ["ご飯・パン・麺の", "カロリー早見表"],
    lead: "量ごとのカロリーの目安",
  },
] as const;

function card(lines: readonly string[], lead: string) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#E6D9C8",
        padding: "36px",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF6EE",
          borderRadius: "36px",
          borderTop: "18px solid #F5821F",
          borderBottom: "18px solid #F5821F",
        }}
      >
        <div style={{ fontSize: 36, color: "#8A7360" }}>メモレバ</div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 68,
            lineHeight: 1.3,
            color: "#3A2A22",
          }}
        >
          {lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <div style={{ marginTop: 28, width: 72, height: 6, background: "#F5821F" }} />
        <div style={{ marginTop: 28, fontSize: 32, color: "#6B4A32" }}>{lead}</div>
      </div>
    </div>
  );
}

async function main() {
  mkdirSync("public/og", { recursive: true });
  for (const page of pages) {
    const image = new ImageResponse(card(page.lines, page.lead), {
      width: 1200,
      height: 630,
      fonts: [{ name: "Noto Sans JP", data: font, weight: 500, style: "normal" }],
    });
    const bytes = Buffer.from(await image.arrayBuffer());
    writeFileSync(`public/og/${page.file}`, bytes);
    console.log(page.file, bytes.length);
  }
}

main();
