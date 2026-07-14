import { z } from "zod";
import { inviteCodeSchema } from "@/lib/validation/common";

export const joinGroupSchema = z.object({
  inviteCode: inviteCodeSchema,
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
