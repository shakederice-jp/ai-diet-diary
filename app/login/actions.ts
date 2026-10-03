"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { mapAuthError } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginFormState = {
  error: string | null;
  sent: boolean;
};

export type AuthFormState = {
  error: string | null;
  message: string | null;
};

const emptyAuthState: AuthFormState = { error: null, message: null };

function appOrigin(headerList: Headers) {
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "")
    .split(",")[0]
    .trim();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  return `${proto}://${host}`;
}

function readEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendMagicLink(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = readEmail(formData);
  if (!validEmail(email)) {
    return { error: "メールアドレスを確認してください。", sent: false };
  }

  const headerList = await headers();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appOrigin(headerList)}/auth/callback` },
  });
  if (error) {
    return {
      error: "ログイン用のメールを送れませんでした。しばらくしてからもう一度お試しください。",
      sent: false,
    };
  }
  return { error: null, sent: true };
}

export async function signInWithPassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!validEmail(email) || password.length === 0) {
    return { ...emptyAuthState, error: "メールアドレスまたはパスワードが違います" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ...emptyAuthState, error: mapAuthError(error, "login") };
  }
  redirect("/");
}

export async function signUpWithPassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!validEmail(email)) {
    return { ...emptyAuthState, error: "メールアドレスを確認してください。" };
  }
  if (password.length < 8) {
    return { ...emptyAuthState, error: "パスワードは8文字以上にしてください。" };
  }

  const headerList = await headers();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appOrigin(headerList)}/auth/confirm?type=signup`,
    },
  });
  if (error) {
    return { ...emptyAuthState, error: mapAuthError(error, "signup") };
  }
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ...emptyAuthState, error: "このメールアドレスは登録済みです" };
  }
  if (data.session) {
    redirect("/");
  }
  return {
    error: null,
    message:
      "確認メールを送りました。届いたリンクを開くと登録が完了します。別の端末やブラウザで開いても大丈夫です。",
  };
}

export async function requestPasswordSetup(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  if (!validEmail(email)) {
    return { ...emptyAuthState, error: "メールアドレスを確認してください。" };
  }

  const headerList = await headers();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin(headerList)}/auth/confirm?type=recovery`,
  });
  if (error) {
    return { ...emptyAuthState, error: mapAuthError(error, "send") };
  }
  return {
    error: null,
    message:
      "設定用のメールを送りました。届いたリンクを開いて、新しいパスワードを入力してください。別の端末やブラウザで開いても大丈夫です。",
  };
}

export async function updatePassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirm") ?? "");
  if (password.length < 8) {
    return { ...emptyAuthState, error: "パスワードは8文字以上にしてください。" };
  }
  if (password !== confirmation) {
    return { ...emptyAuthState, error: "パスワードが一致しません。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      ...emptyAuthState,
      error: "パスワード設定用のリンクを開き直して、もう一度お試しください。",
    };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ...emptyAuthState, error: mapAuthError(error, "password") };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
