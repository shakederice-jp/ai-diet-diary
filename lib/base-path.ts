/** finance-tower.com/diet 配下で公開するための共通設定。next.config.ts の basePath と必ず同じ値にする。 */
export const BASE_PATH = "/diet";

/** 本番の公開オリジン。サーバー側で作るリダイレクト先・メール内リンクは、内部の *.vercel.app ではなくここを使う。 */
export const PUBLIC_ORIGIN = "https://finance-tower.com";

/**
 * アプリ内のパスに BASE_PATH を付ける。すでに付いているパス・外部URLはそのまま返す。
 * <Link>・redirect()・router は自動で付くので、使うのは <a href>・<img src>・手組みのURLだけ。
 */
export function withBase(path: string): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return path;
  }
  if (
    path === BASE_PATH ||
    path.startsWith(`${BASE_PATH}/`) ||
    path.startsWith(`${BASE_PATH}?`) ||
    path.startsWith(`${BASE_PATH}#`)
  ) {
    return path;
  }
  if (path === "/") {
    return BASE_PATH;
  }
  return `${BASE_PATH}${path}`;
}

/** サーバー側で外向きに使うオリジン。本番は固定、開発は受けたリクエストのオリジン。 */
export function publicOrigin(requestOrigin: string): string {
  return process.env.NODE_ENV === "production" ? PUBLIC_ORIGIN : requestOrigin;
}

/** オリジンに BASE_PATH を足した、アプリのルートURL(末尾スラッシュなし)。 */
export function appBaseUrl(requestOrigin: string): string {
  return `${publicOrigin(requestOrigin)}${BASE_PATH}`;
}
