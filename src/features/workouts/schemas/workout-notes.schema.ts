import { z } from "zod";

export const workoutNotesSchema = z.object({
  notes: z.string().max(1000, "Notes must be at most 1000 characters."),
});

export type WorkoutNotesInput = z.infer<typeof workoutNotesSchema>;
