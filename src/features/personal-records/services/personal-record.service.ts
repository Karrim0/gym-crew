import { NotImplementedError } from "@/lib/utils/errors";
import type { UUID } from "@/types";
import type { PersonalRecordWithExerciseName } from "../types";

export async function fetchPersonalRecords(userId: UUID): Promise<PersonalRecordWithExerciseName[]> {
  void userId;
  throw new NotImplementedError("fetchPersonalRecords");
}
