import { z } from "zod";

const weekdaySchema = z.enum([
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]);

const workoutTypeSchema = z.enum(["push", "pull", "legs", "rest", "custom"]);
const iconKeySchema = z.enum(["dumbbell", "zap", "target", "flame", "shield", "heart", "moon", "activity"]);
const colorKeySchema = z.enum(["indigo", "blue", "emerald", "amber", "rose", "violet"]);
const muscleSchema = z.enum(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core"]);

export const importedPlanExerciseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  primaryMuscle: muscleSchema,
  sets: z.number().int().min(1).max(20),
  repsMin: z.number().int().min(1).max(100),
  repsMax: z.number().int().min(1).max(100),
  notes: z.string().trim().max(160).optional().default(""),
  confidence: z.number().min(0).max(1).optional().default(1),
}).refine((exercise) => exercise.repsMax >= exercise.repsMin, {
  message: "Maximum reps must be at least minimum reps.",
  path: ["repsMax"],
});

export const importedPlanDaySchema = z.object({
  weekday: weekdaySchema,
  workoutType: workoutTypeSchema,
  title: z.string().trim().min(2).max(40),
  focus: z.string().trim().min(2).max(32),
  iconKey: iconKeySchema,
  colorKey: colorKeySchema,
  notes: z.string().trim().max(240).default(""),
  exercises: z.array(importedPlanExerciseSchema).max(30),
});

export const importedPlanSchema = z.object({
  title: z.string().trim().min(2).max(80),
  days: z.array(importedPlanDaySchema).length(7),
  warnings: z.array(z.string().trim().min(2).max(180)).max(12).default([]),
}).superRefine((plan, context) => {
  const weekdays = new Set(plan.days.map((day) => day.weekday));
  if (weekdays.size !== 7) {
    context.addIssue({ code: "custom", message: "The plan must contain every weekday exactly once.", path: ["days"] });
  }

  const ordered = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"] as const;
  const types = ordered.map((weekday) => plan.days.find((day) => day.weekday === weekday)?.workoutType ?? "rest");
  for (let index = 0; index < types.length; index += 1) {
    if (types[index] === "rest" && types[(index + 1) % 7] === "rest" && types[(index + 2) % 7] === "rest") {
      context.addIssue({ code: "custom", message: "A plan cannot contain more than two consecutive rest days.", path: ["days"] });
      break;
    }
  }
});

export type ImportedPlanSchema = z.infer<typeof importedPlanSchema>;
