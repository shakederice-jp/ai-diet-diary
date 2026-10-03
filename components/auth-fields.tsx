"use client";

import { useState } from "react";
import { authInputClass } from "@/components/auth-styles";

export function EmailField() {
  return (
    <label className="block text-xs text-zinc-600">
      メールアドレス
      <input
        name="email"
        type="email"
        required
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="you@example.com"
        className={authInputClass}
      />
    </label>
  );
}

export function PasswordField({
  name = "password",
  label,
  autoComplete,
  minLength,
}: {
  name?: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-xs text-zinc-600">
      {label}
      <span className="relative mt-1 block">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          minLength={minLength}
          spellCheck={false}
          className={`${authInputClass} mt-0 pr-20`}
        />
        <button
          type="button"
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-1 inline-flex h-10 min-w-14 -translate-y-1/2 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#F5821F]"
        >
          {visible ? "非表示" : "表示"}
        </button>
      </span>
    </label>
  );
}
