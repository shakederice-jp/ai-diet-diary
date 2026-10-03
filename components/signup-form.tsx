"use client";

import { useActionState } from "react";
import { signUpWithPassword, type AuthFormState } from "@/app/login/actions";
import { AuthFrame } from "@/components/auth-frame";
import { EmailField, PasswordField } from "@/components/auth-fields";
import { authLinkClass, authSubmitClass } from "@/components/auth-styles";
import { InstantLink } from "@/components/instant-link";

const initialState: AuthFormState = { error: null, message: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpWithPassword, initialState);

  return (
    <AuthFrame
      title="新規登録"
      description="メールアドレスと、8文字以上のパスワードで登録します。確認メールのリンクを開くと完了です。"
    >
      <form action={formAction} className="flex flex-col gap-4" autoComplete="on">
        <EmailField />
        <PasswordField label="パスワード" autoComplete="new-password" minLength={8} />
        <button type="submit" disabled={pending} className={authSubmitClass}>
          {pending ? "登録しています…" : "登録する"}
        </button>
      </form>
      {state.error ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {state.message}
        </p>
      ) : null}
      <div className="mt-6">
        <InstantLink href="/login" className={authLinkClass}>
          ログインはこちら
        </InstantLink>
      </div>
    </AuthFrame>
  );
}
