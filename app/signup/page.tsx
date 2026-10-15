import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { pageMetadata } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = pageMetadata({
  title: "新規登録",
  path: "/signup",
  index: false,
});

export default async function SignupPage() {
  if (await getAuthUserId()) {
    redirect("/");
  }
  return <SignupForm />;
}
