type ClassValue = string | number | null | boolean | undefined;

/**
 * Minimal `clsx`-style class name joiner. Kept dependency-free since this is
 * the only class-merging behavior the scaffold currently needs.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
