import type { Metadata } from "next";
import { AuthFrame } from "@/components/auth-frame";
import { authLinkClass } from "@/components/auth-styles";
import { InstantLink } from "@/components/instant-link";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "新しいパスワード | AI Diet Diary",
};

type ResetSearchParams = Promise<{
  claim?: string;
}>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: ResetSearchParams;
}) {
  const params = await searchParams;
  const userId = await getAuthUserId();
  if (!userId) {
    return (
      <AuthFrame
        title="パスワードを設定する"
        description="設定用メールのリンクを開くと、この画面で新しいパスワードを入力できます。"
      >
        <InstantLink href="/forgot-password" className={authLinkClass}>
          設定用メールを送る
        </InstantLink>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="新しいパスワード"
      description="8文字以上のパスワードを、2回入力してください。保存すると、このメールアドレスとパスワードでログインできます。"
    >
      {params.claim === "error" ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          ログインはできましたが、以前の記録の引き継ぎに失敗しました。
        </p>
      ) : null}
      <ResetPasswordForm />
    </AuthFrame>
  );
}
