import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { AdvisorId } from "@/lib/advisors";

const RASTER = [
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
] as const;

export function loadCharacterRaster(id: AdvisorId) {
  const dir = path.join(process.cwd(), "public", "characters");
  for (const [ext, mime] of RASTER) {
    const file = path.join(dir, `${id}.${ext}`);
    if (!existsSync(file)) {
      continue;
    }
    return `data:${mime};base64,${readFileSync(file).toString("base64")}`;
  }
  return null;
}
