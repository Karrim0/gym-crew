import { z } from "zod";

export const workoutSetInputSchema = z.object({
  weightKg: z
    .number()
    .min(0, "الوزن مينفعش يبقى بالسالب.")
    .max(500, "الوزن شكله كبير جدًا، راجعه تاني.")
    .nullable(),
  reps: z
    .number()
    .int("العدات لازم تبقى رقم صحيح.")
    .min(0, "العدات مينفعش تبقى بالسالب.")
    .max(100, "عدد العدات شكله كبير جدًا، راجعه تاني.")
    .nullable(),
  isCompleted: z.boolean(),
});

export type WorkoutSetInput = z.infer<typeof workoutSetInputSchema>;
