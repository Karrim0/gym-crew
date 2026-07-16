import { z } from "zod";

export const workoutNotesSchema = z.object({
  notes: z.string().max(1000, "الملاحظات مينفعش تزيد عن 1000 حرف."),
});

export type WorkoutNotesInput = z.infer<typeof workoutNotesSchema>;
