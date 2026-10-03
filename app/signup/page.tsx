import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "新規登録 | AI Diet Diary",
};

export default async function SignupPage() {
  if (await getAuthUserId()) {
    redirect("/");
  }
  return <SignupForm />;
}
