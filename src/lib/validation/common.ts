import { z } from "zod";

/**
 * Shared Zod primitives reused across multiple feature schemas. Feature
 * schemas (under each feature's schemas folder) should compose these rather
 * than redefining equivalent rules, so validation behavior (e.g. what
 * counts as a valid password) only needs to change in one place.
 */

export const emailSchema = z.email("Enter a valid email address.").trim();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(40, "Name must be at most 40 characters.");

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
  .length(8, "Invite codes are 8 characters.");
