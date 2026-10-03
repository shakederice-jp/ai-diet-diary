import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "パスワードを設定する | AI Diet Diary",
};

export default async function ForgotPasswordPage() {
  if (await getAuthUserId()) {
    redirect("/");
  }
  return <ForgotPasswordForm />;
}
