import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ログイン | AI Diet Diary",
};

type LoginSearchParams = Promise<{
  error?: string;
  login?: string;
}>;

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  if (await getAuthUserId()) {
    redirect("/");
  }
  const params = await searchParams;
  const notice =
    params.error === "link" || params.login === "error"
      ? "確認リンクの有効期限が切れているか、すでに使われています。もう一度やり直してください。"
      : null;
  return <LoginForm notice={notice} />;
}
