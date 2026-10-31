// 使い方: npm run icons
// design/memolever-icon.svg をそのまま縮小して public/icons/ に PNG を出す。
// 文字はすでに図形なので、フォントは使わない。
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "design", "memolever-icon.svg");
const outDir = join(root, "public", "icons");

const source = readFileSync(sourcePath, "utf8");

function maskableSvg(svg) {
  const open = svg.indexOf("<path");
  const close = svg.lastIndexOf("</svg>");
  if (open < 0 || close < 0 || open > close) {
    throw new Error("design/memolever-icon.svg に path が見つかりません");
  }
  const paths = svg.slice(open, close);
  const pathCount = paths.match(/<path\b/g)?.length ?? 0;
  if (pathCount !== 2) {
    throw new Error(`path は2つである必要があります (実際: ${pathCount})`);
  }
  return (
    svg.slice(0, open) +
    '<g transform="translate(512 512) scale(0.84) translate(-512 -512)">' +
    paths +
    "</g>" +
    svg.slice(close)
  );
}

const outputs = [
  { name: "icon-180.png", size: 180, svg: source },
  { name: "icon-192.png", size: 192, svg: source },
  { name: "icon-512.png", size: 512, svg: source },
  { name: "icon-maskable-512.png", size: 512, svg: maskableSvg(source) },
];

mkdirSync(outDir, { recursive: true });

for (const output of outputs) {
  const file = join(outDir, output.name);
  const info = await sharp(Buffer.from(output.svg))
    .resize(output.size, output.size)
    .png()
    .toFile(file);
  if (!info.size) {
    throw new Error(`${output.name} が空です`);
  }
  if (info.width !== output.size || info.height !== output.size) {
    throw new Error(
      `${output.name} のサイズが ${info.width}x${info.height} です`,
    );
  }
  console.log(`${output.name} ${info.width}x${info.height} ${info.size} bytes`);
}
