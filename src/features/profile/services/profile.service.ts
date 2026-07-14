import { NotImplementedError } from "@/lib/utils/errors";
import type { UUID, UserProfile } from "@/types";
import type { UpdateProfileInput } from "../schemas/update-profile.schema";

export async function fetchProfile(userId: UUID): Promise<UserProfile | null> {
  void userId;
  throw new NotImplementedError("fetchProfile");
}

export async function updateProfile(userId: UUID, input: UpdateProfileInput): Promise<UserProfile> {
  void userId;
  void input;
  throw new NotImplementedError("updateProfile");
}
