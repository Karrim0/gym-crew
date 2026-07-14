import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import type { UUID, UserProfile } from "@/types";
import type { UpdateProfileInput } from "../schemas/update-profile.schema";

type ProfileRow = Tables<"profiles">;

export function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    additionalRestDays: row.additional_rest_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchProfile(userId: UUID): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProfile(data) : null;
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
  return mapProfile(data);
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
