"use client";

import { getArabicErrorMessage } from "@/lib/localization";
import { LanguageSwitcher } from "@/components/localization/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useEffect, useState } from "react";
import { Camera, Save, UserRound } from "lucide-react";
import type { UUID, UserProfile } from "@/types";
import { fetchProfile, updateProfile, uploadProfileAvatar } from "../services/profile.service";

interface ProfileSettingsClientProps { userId: UUID }

export function ProfileSettingsClient({ userId }: ProfileSettingsClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile(userId).then((value) => {
      setProfile(value);
      setDisplayName(value?.displayName ?? "");
      setAvatarUrl(value?.avatarUrl ?? null);
    }).catch((caught) => setError(getArabicErrorMessage(caught, "معرفناش نحمّل الحساب.")));
  }, [userId]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setIsSaving(true);
    setError(null);
    try {
      const url = await uploadProfileAvatar(userId, file);
      setAvatarUrl(url);
      setMessage("الصورة اترفعت. اضغط حفظ عشان تحدّث حسابك.");
    } catch (caught) {
      setError(getArabicErrorMessage(caught, "معرفناش نرفع الصورة."));
    } finally {
      setIsSaving(false);
    }
  }

  async function save() {
    if (displayName.trim().length < 2) {
      setError("الاسم لازم يبقى حرفين على الأقل.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateProfile(userId, { displayName, avatarUrl });
      setProfile(updated);
      setMessage("الحساب اتحفظ.");
    } catch (caught) {
      setError(getArabicErrorMessage(caught, "معرفناش نحفظ الحساب."));
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile && !error) return <p className="py-8 text-center text-sm text-neutral-500">بنحمّل الحساب…</p>;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <LanguageSwitcher variant="panel" />
        <ThemeSwitcher variant="panel" />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="صورة الحساب" className="h-24 w-24 rounded-full border object-cover shadow-sm" />
          ) : (
            <span className="gc-avatar-placeholder grid h-24 w-24 place-items-center rounded-full border"><UserRound className="h-10 w-10" /></span>
          )}
          <label className="gc-brand-mark absolute bottom-0 end-0 cursor-pointer rounded-full p-2">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
          </label>
        </div>
        <div>
          <h2 className="font-semibold">صورة الحساب</h2>
          <p className="text-sm text-neutral-500">JPG أو PNG أو WebP، بحد أقصى 2 ميجا.</p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">الاسم الظاهر</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} className="gc-input" />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      <button type="button" disabled={isSaving} onClick={() => void save()} className="gc-primary-button w-full disabled:opacity-50">
        <Save className="h-4 w-4" /> {isSaving ? "بنحفظ…" : "احفظ الحساب"}
      </button>
    </div>
  );
}
