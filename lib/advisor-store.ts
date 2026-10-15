import { isAdvisorId, type AdvisorId } from "@/lib/advisors";
import { createDataClient } from "@/lib/supabase/server";

export type StoredAdvisorComment = {
  advisorId: AdvisorId;
  recordHash: string;
  comment: string;
};

export async function getAdvisorPreference(userId: string): Promise<AdvisorId | null> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("advisor_preferences")
    .select("advisor_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load advisor preference: ${error.message}`);
  }
  if (!data || typeof data.advisor_id !== "string" || !isAdvisorId(data.advisor_id)) {
    return null;
  }
  return data.advisor_id;
}

export async function upsertAdvisorPreference(userId: string, advisorId: AdvisorId) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("advisor_preferences").upsert(
    {
      user_id: userId,
      advisor_id: advisorId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to save advisor preference: ${error.message}`);
  }
}

export async function listRecentAdvisorComments(userId: string, beforeDate: string, limit = 5) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("advisor_comments")
    .select("recorded_on, comment")
    .eq("user_id", userId)
    .lt("recorded_on", beforeDate)
    .order("recorded_on", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recent advisor comments: ${error.message}`);
  }

  return (data ?? [])
    .flatMap((row) => {
      if (typeof row.recorded_on !== "string" || typeof row.comment !== "string") {
        return [];
      }
      const comment = row.comment.trim();
      if (!comment) {
        return [];
      }
      return [{ date: row.recorded_on, comment }];
    })
    .reverse();
}

export async function getAdvisorComment(
  userId: string,
  date: string,
): Promise<StoredAdvisorComment | null> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("advisor_comments")
    .select("advisor_id, record_hash, comment")
    .eq("user_id", userId)
    .eq("recorded_on", date)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load advisor comment: ${error.message}`);
  }
  if (
    !data ||
    typeof data.advisor_id !== "string" ||
    !isAdvisorId(data.advisor_id) ||
    typeof data.record_hash !== "string" ||
    typeof data.comment !== "string"
  ) {
    return null;
  }

  return {
    advisorId: data.advisor_id,
    recordHash: data.record_hash,
    comment: data.comment,
  };
}

export async function upsertAdvisorComment(input: {
  userId: string;
  date: string;
  advisorId: AdvisorId;
  recordHash: string;
  comment: string;
}) {
  const supabase = await createDataClient();
  const { error } = await supabase.from("advisor_comments").upsert(
    {
      user_id: input.userId,
      recorded_on: input.date,
      advisor_id: input.advisorId,
      record_hash: input.recordHash,
      comment: input.comment,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,recorded_on" },
  );

  if (error) {
    throw new Error(`Failed to save advisor comment: ${error.message}`);
  }
}

export async function deleteAdvisorComment(userId: string, date: string) {
  const supabase = await createDataClient();
  const { error } = await supabase
    .from("advisor_comments")
    .delete()
    .eq("user_id", userId)
    .eq("recorded_on", date);

  if (error) {
    throw new Error(`Failed to delete advisor comment: ${error.message}`);
  }
}
