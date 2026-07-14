import { z } from "zod";
import { weekdaySchema } from "@/lib/validation/common";
import { FIXED_REST_DAY, MAX_PERSONAL_REST_DAYS } from "@/constants/schedule";

/**
 * Validates a member's chosen additional rest days.
 *
 * Rules:
 * - Friday (`FIXED_REST_DAY`) is always a rest day and must not be selected
 *   again here — it is implicit, not a personal choice.
 * - At most `MAX_PERSONAL_REST_DAYS` additional days may be chosen.
 * - Days must be unique.
 */
export const personalRestDaySchema = z
  .object({
    additionalRestDays: z.array(weekdaySchema).max(MAX_PERSONAL_REST_DAYS, {
      message: `You can choose at most ${MAX_PERSONAL_REST_DAYS} additional rest days.`,
    }),
  })
  .refine((data) => !data.additionalRestDays.includes(FIXED_REST_DAY), {
    message: "Friday is already a fixed rest day — no need to select it.",
    path: ["additionalRestDays"],
  })
  .refine((data) => new Set(data.additionalRestDays).size === data.additionalRestDays.length, {
    message: "Rest days must be unique.",
    path: ["additionalRestDays"],
  });

export type PersonalRestDayInput = z.infer<typeof personalRestDaySchema>;
