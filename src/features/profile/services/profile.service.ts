import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { cacheProfile, getCachedProfile } from "@/lib/offline";
import type { UUID, UserProfile } from "@/types";
import type { UpdateProfileInput } from "../schemas/update-profile.schema";

type ProfileRow = Tables<"profiles">;

export function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    additionalRestDays: row.additional_rest_days,
    shareWorkoutSummary: row.share_workout_summary,
    sharePersonalRecords: row.share_personal_records,
    shareWeights: row.share_weights,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchProfile(userId: UUID): Promise<UserProfile | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const profile = data ? mapProfile(data) : null;
    if (profile) await cacheProfile(profile);
    return profile;
  } catch (caught) {
    const cached = await getCachedProfile(userId);
    if (cached) return cached;
    throw caught;
  }
}

export async function updateProfile(userId: UUID, input: UpdateProfileInput): Promise<UserProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim(),
      avatar_url: input.avatarUrl ?? null,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const profile = mapProfile(data);
  await cacheProfile(profile);
  return profile;
}

export async function uploadProfileAvatar(userId: UUID, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Avatar must be smaller than 2 MB.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${extension}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) throw new Error(error.message);
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export interface SharingPreferencesInput {
  shareWorkoutSummary: boolean;
  sharePersonalRecords: boolean;
  shareWeights: boolean;
}

export async function updateSharingPreferences(
  userId: UUID,
  input: SharingPreferencesInput,
): Promise<UserProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      share_workout_summary: input.shareWorkoutSummary,
      share_personal_records: input.sharePersonalRecords,
      share_weights: input.shareWeights,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const profile = mapProfile(data);
  await cacheProfile(profile);
  return profile;
}
