import { z } from "zod";

export const workoutSetInputSchema = z.object({
  weightKg: z
    .number()
    .min(0, "Weight cannot be negative.")
    .max(500, "Weight seems too high — double check it.")
    .nullable(),
  reps: z
    .number()
    .int("Reps must be a whole number.")
    .min(0, "Reps cannot be negative.")
    .max(100, "Reps seems too high — double check it.")
    .nullable(),
  isCompleted: z.boolean(),
});

export type WorkoutSetInput = z.infer<typeof workoutSetInputSchema>;
