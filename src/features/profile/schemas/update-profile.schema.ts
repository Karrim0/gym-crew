import { z } from "zod";
import { displayNameSchema } from "@/lib/validation/common";

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: z.url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
