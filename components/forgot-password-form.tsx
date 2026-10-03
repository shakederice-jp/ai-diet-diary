"use client";

import { useActionState } from "react";
import { requestPasswordSetup, type AuthFormState } from "@/app/login/actions";
import { AuthFrame } from "@/components/auth-frame";
import { EmailField } from "@/components/auth-fields";
import { authLinkClass, authSubmitClass } from "@/components/auth-styles";
import { InstantLink } from "@/components/instant-link";

const initialState: AuthFormState = { error: null, message: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordSetup, initialState);

  return (
    <AuthFrame
      title="パスワードを設定する"
      description="メールアドレスを入力すると、設定用のリンクを送ります。メールのリンクは、別の端末やブラウザで開いても使えます。メールリンクだけで使っていたアカウントも、ここからパスワードを付けられます。記録はそのまま残ります。"
    >
      <form action={formAction} className="flex flex-col gap-4" autoComplete="on">
        <EmailField />
        <button type="submit" disabled={pending} className={authSubmitClass}>
          {pending ? "送信しています…" : "設定用メールを送る"}
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
          ログインに戻る
        </InstantLink>
      </div>
    </AuthFrame>
  );
}
