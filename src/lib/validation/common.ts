import { z } from "zod";

/**
 * Shared Zod primitives reused across multiple feature schemas. Feature
 * schemas (under each feature's schemas folder) should compose these rather
 * than redefining equivalent rules, so validation behavior (e.g. what
 * counts as a valid password) only needs to change in one place.
 */

export const emailSchema = z.email("اكتب إيميل صحيح.").trim();

export const passwordSchema = z
  .string()
  .min(8, "الباسورد لازم يبقى 8 حروف على الأقل.")
  .max(72, "الباسورد مينفعش يزيد عن 72 حرف.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "الاسم لازم يبقى حرفين على الأقل.")
  .max(40, "الاسم مينفعش يزيد عن 40 حرف.");

export const uuidSchema = z.uuid();

export const weekdaySchema = z.enum([
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]);

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(8, "كود الدعوة لازم يبقى 8 حروف.");
