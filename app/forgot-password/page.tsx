import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = pageMetadata({
  title: "パスワードを設定する",
  path: "/forgot-password",
  index: false,
});

export default async function ForgotPasswordPage() {
  if (await getAuthUserId()) {
    redirect("/");
  }
  return <ForgotPasswordForm />;
}
