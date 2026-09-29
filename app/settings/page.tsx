import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { SettingsFrame } from "@/components/settings-frame";
import { decimalInputValue, isoYearsBefore, type ActivityLevel, type Gender } from "@/lib/calorie-plan";
import { tokyoToday } from "@/lib/calendar";
import { readUserIdFromCookies } from "@/lib/session";
import { getProfile, storageErrorMessage } from "@/lib/user-settings";

export const metadata: Metadata = {
  title: "プロフィール | AI Diet Diary",
};

export default async function SettingsPage() {
  const today = tokyoToday();
  const userId = await readUserIdFromCookies();
  let heightCm = "";
  let birthDate = "";
  let gender: Gender | "" = "";
  let activityLevel: ActivityLevel | "" = "";
  let loadError: string | null = null;

  if (userId) {
    try {
      const profile = await getProfile(userId);
      if (profile) {
        heightCm = decimalInputValue(profile.heightCm);
        birthDate = profile.birthDate;
        gender = profile.gender;
        activityLevel = profile.activityLevel;
      }
    } catch (error) {
      loadError = storageErrorMessage(error, "プロフィールを読み込めませんでした。");
    }
  }

  return (
    <SettingsFrame
      current="settings"
      eyebrow="プロフィール"
      title="体の設定"
      description="身長、生年月日、性別、活動量を保存します。目標カロリーの計算に使います。"
    >
      {loadError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}
      <ProfileForm
        initial={{ heightCm, birthDate, gender, activityLevel }}
        minBirthDate={isoYearsBefore(today, 101)}
        maxBirthDate={isoYearsBefore(today, 15)}
      />
    </SettingsFrame>
  );
}
