import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Group name must be at least 3 characters.")
    .max(50, "Group name must be at most 50 characters."),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
