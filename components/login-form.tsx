"use client";

import { useActionState } from "react";
import { signInWithPassword, type AuthFormState } from "@/app/login/actions";
import { AuthFrame } from "@/components/auth-frame";
import { EmailField, PasswordField } from "@/components/auth-fields";
import { authLinkClass, authSubmitClass } from "@/components/auth-styles";
import { InstantLink } from "@/components/instant-link";

const initialState: AuthFormState = { error: null, message: null };

export function LoginForm({ notice = null }: { notice?: string | null }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);

  return (
    <AuthFrame
      title="ログイン"
      description="メールアドレスとパスワードでログインします。どの端末からでも、同じ組み合わせで入れます。"
    >
      <form action={formAction} className="flex flex-col gap-4" autoComplete="on">
        <EmailField />
        <PasswordField label="パスワード" autoComplete="current-password" />
        <button type="submit" disabled={pending} className={authSubmitClass}>
          {pending ? "ログインしています…" : "ログイン"}
        </button>
      </form>
      {notice ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {notice}
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col items-start gap-1">
        <InstantLink href="/signup" className={authLinkClass}>
          新規登録はこちら
        </InstantLink>
        <InstantLink href="/forgot-password" className={authLinkClass}>
          パスワードを設定する・忘れた方はこちら
        </InstantLink>
      </div>
    </AuthFrame>
  );
}
