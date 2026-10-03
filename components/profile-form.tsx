"use client";

import { useActionState, useState } from "react";
import { saveProfile, type ProfileFormState } from "@/app/settings/actions";
import { ChoiceField } from "@/components/choice-field";
import {
  ACTIVITY_OPTIONS,
  GENDER_OPTIONS,
  type ActivityLevel,
  type Gender,
} from "@/lib/calorie-plan";

const initialState: ProfileFormState = { error: null, savedAt: null };
const fieldClass =
  "h-12 w-full rounded-xl border border-[#E4D7C6] bg-[#FBF6EE] px-3 text-sm outline-none focus:border-[#F5821F]";

export function ProfileForm({
  initial,
  minBirthDate,
  maxBirthDate,
}: {
  initial: {
    heightCm: string;
    birthDate: string;
    gender: Gender | "";
    activityLevel: ActivityLevel | "";
  };
  minBirthDate: string;
  maxBirthDate: string;
}) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);
  const [gender, setGender] = useState<Gender | "">(initial.gender);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">(initial.activityLevel);

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-950">
        身長 (cm)
        <input
          name="heightCm"
          required
          inputMode="decimal"
          min={100}
          max={250}
          step={0.1}
          defaultValue={initial.heightCm}
          placeholder="例: 170.0"
          aria-label="身長 (cm)"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-950">
        生年月日
        <input
          type="date"
          name="birthDate"
          required
          min={minBirthDate}
          max={maxBirthDate}
          defaultValue={initial.birthDate}
          aria-label="生年月日"
          className={fieldClass}
        />
      </label>

      <ChoiceField
        name="gender"
        legend="性別"
        value={gender}
        options={GENDER_OPTIONS}
        onChange={setGender}
      />

      <ChoiceField
        name="activityLevel"
        legend="活動量"
        value={activityLevel}
        options={ACTIVITY_OPTIONS}
        onChange={setActivityLevel}
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#F5821F] px-6 text-sm font-medium text-white hover:bg-[#E06E0C] disabled:brightness-90 sm:w-auto"
      >
        {pending ? "保存しています…" : "保存する"}
      </button>

      <div aria-live="polite">
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        {state.savedAt ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            保存しました。目標設定で摂取カロリーの目安を計算できます。
          </p>
        ) : null}
      </div>
    </form>
  );
}
