"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginFormState } from "@/app/login/actions";

const initialState: LoginFormState = { error: null, sent: false };

export function LoginScreen({ notice = null }: { notice?: string | null }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main className="w-full max-w-md rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-[#F5821F]">AI Diet Diary</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">ログイン</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          メールアドレスを入力すると、ログイン用のリンクが届きます。パスワードは不要です。
        </p>
        <form action={formAction} className="mt-6">
          <label className="block text-xs text-zinc-600">
            メールアドレス
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 h-12 w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-4 text-sm outline-none focus:border-[#F5821F]"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C] disabled:opacity-60"
          >
            {pending ? "送信しています…" : "ログイン用リンクを送る"}
          </button>
        </form>
        {notice ? <p className="mt-3 text-sm text-red-800">{notice}</p> : null}
        {state.error ? <p className="mt-3 text-sm text-red-800">{state.error}</p> : null}
        {state.sent ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            メールを送りました。届いたリンクを開くとログインできます。
          </p>
        ) : null}
      </main>
    </div>
  );
}
