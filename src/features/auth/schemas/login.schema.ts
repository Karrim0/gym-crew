import { z } from "zod";
import { emailSchema } from "@/lib/validation/common";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "اكتب الباسورد."),
});

export type LoginInput = z.infer<typeof loginSchema>;
