import { isAdvisorId, type AdvisorId } from "@/lib/advisors";
import { createDataClient } from "@/lib/supabase/server";
import { type DiaryEntry } from "@/lib/diary-shared";

export { DIARY_BODY_LIMIT, DIARY_PRIVACY_NOTICE, DIARY_REPLY_LIMIT, type DiaryEntry } from "@/lib/diary-shared";

type DiaryRow = {
  body: string;
  ai_reply: string | null;
  advisor_id: string | null;
  reply_sensitive: boolean;
  share_reply: boolean;
  reply_count: number;
};

function mapDiary(row: DiaryRow): DiaryEntry | null {
  if (typeof row.body !== "string" || row.body.length === 0) {
    return null;
  }
  return {
    body: row.body,
    aiReply: row.ai_reply?.trim() ? row.ai_reply : null,
    advisorId: row.advisor_id && isAdvisorId(row.advisor_id) ? row.advisor_id : null,
    replySensitive: row.reply_sensitive === true,
    shareReply: row.reply_sensitive === true ? false : row.share_reply !== false,
    replyCount: Number.isInteger(row.reply_count) && row.reply_count > 0 ? row.reply_count : 0,
  };
}

export async function getDiaryEntry(userId: string, date: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("diary_entries")
    .select("body, ai_reply, advisor_id, reply_sensitive, share_reply, reply_count")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapDiary(data as DiaryRow) : null;
}

export async function listDiaryInMonth(userId: string, start: string, end: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("diary_entries")
    .select("entry_date, body, ai_reply, advisor_id, reply_sensitive, share_reply, reply_count")
    .eq("user_id", userId)
    .gte("entry_date", start)
    .lte("entry_date", end)
    .order("entry_date", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return ((data ?? []) as Array<DiaryRow & { entry_date: string }>)
    .map((row) => {
      const entry = mapDiary(row);
      return entry ? { date: row.entry_date, ...entry } : null;
    })
    .filter((row): row is DiaryEntry & { date: string } => row != null);
}

export async function saveDiaryBody(userId: string, date: string, body: string) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("diary_entries").upsert(
    {
      user_id: userId,
      entry_date: date,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" },
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveDiaryReply(
  userId: string,
  date: string,
  input: {
    reply: string;
    advisorId: AdvisorId;
    sensitive: boolean;
    shareReply: boolean;
    replyCount: number;
  },
) {
  const supabase = await createDataClient();
  const { error } = await supabase
    .from("diary_entries")
    .update({
      ai_reply: input.reply,
      advisor_id: input.advisorId,
      reply_sensitive: input.sensitive,
      share_reply: input.sensitive ? false : input.shareReply,
      reply_generated_at: new Date().toISOString(),
      reply_count: input.replyCount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("entry_date", date);
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveDiaryShareReply(userId: string, date: string, shareReply: boolean) {
  const current = await getDiaryEntry(userId, date);
  if (!current) {
    return { ok: false as const, error: "先にひとことを保存してください。" };
  }
  const next = current.replySensitive ? false : shareReply;
  const supabase = await createDataClient();
  const { error } = await supabase
    .from("diary_entries")
    .update({
      share_reply: next,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("entry_date", date);
  if (error) {
    throw new Error(error.message);
  }
  return { ok: true as const, shareReply: next, locked: current.replySensitive };
}
