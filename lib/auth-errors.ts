type AuthLike = {
  message: string;
  code?: string;
  status?: number;
};

export function mapAuthError(error: AuthLike, action: "login" | "signup" | "send" | "password") {
  const code = (error.code ?? "").toLowerCase();
  const message = error.message.toLowerCase();

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return "メールアドレスまたはパスワードが違います";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "確認メールのリンクを開いてから、ログインしてください。";
  }
  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already exists")
  ) {
    return "このメールアドレスは登録済みです";
  }
  if (code.includes("rate_limit") || message.includes("rate limit") || error.status === 429) {
    return "メールの送信上限に達しました。しばらくしてからもう一度お試しください。";
  }
  if (code === "weak_password" || message.includes("at least") || message.includes("too short")) {
    return "パスワードは8文字以上にしてください。";
  }
  if (code === "same_password" || message.includes("different from the old")) {
    return "前とは違うパスワードにしてください。";
  }
  if (action === "send") {
    return "メールを送れませんでした。しばらくしてからもう一度お試しください。";
  }
  if (action === "password") {
    return "パスワードを保存できませんでした。リンクを開き直して、もう一度お試しください。";
  }
  if (action === "signup") {
    return "登録できませんでした。入力内容を確認して、もう一度お試しください。";
  }
  return "ログインできませんでした。入力内容を確認して、もう一度お試しください。";
}
