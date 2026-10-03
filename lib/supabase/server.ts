import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export const createSupabaseServerClient = cache(async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot always write cookies. The proxy refreshes the session.
        }
      },
    },
  });
});

const getSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  return supabase.auth.getUser();
});

export async function createDataClient() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await getSessionUser();
  if (error || !data.user) {
    throw new Error("ログインしてください。");
  }
  return supabase;
}

export async function getAuthUserId() {
  const { data } = await getSessionUser();
  return data.user?.id ?? null;
}
