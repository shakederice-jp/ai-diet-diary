"use client";

import { useActionState } from "react";
import { updatePassword, type AuthFormState } from "@/app/login/actions";
import { PasswordField } from "@/components/auth-fields";
import { authSubmitClass } from "@/components/auth-styles";

const initialState: AuthFormState = { error: null, message: null };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" autoComplete="on">
      <PasswordField
        label="新しいパスワード"
        autoComplete="new-password"
        minLength={8}
      />
      <PasswordField
        name="passwordConfirm"
        label="新しいパスワード（もう一度）"
        autoComplete="new-password"
        minLength={8}
      />
      <button type="submit" disabled={pending} className={authSubmitClass}>
        {pending ? "保存しています…" : "パスワードを保存する"}
      </button>
      {state.error ? (
        <p className="text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
