import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "اسم الجروب لازم يبقى 3 حروف على الأقل.")
    .max(50, "اسم الجروب مينفعش يزيد عن 50 حرف."),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
