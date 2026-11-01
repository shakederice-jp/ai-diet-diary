import type { AdvisorId } from "@/lib/advisors";

export const DIARY_BODY_LIMIT = 500;
export const DIARY_REPLY_LIMIT = 5;

export const DIARY_PRIVACY_NOTICE =
  "ひとことは、あなたの日記として保存されます。シェアすると公開されます。氏名・住所・電話番号・勤務先・顔写真など、個人が分かることは書かないでください。";

export type DiaryEntry = {
  body: string;
  aiReply: string | null;
  advisorId: AdvisorId | null;
  replySensitive: boolean;
  shareReply: boolean;
  replyCount: number;
};
