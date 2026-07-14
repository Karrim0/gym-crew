/**
 * Thrown by placeholder functions that intentionally have no implementation
 * yet. Prefer this over silently returning fake success, so a placeholder
 * accidentally left in place fails loudly instead of pretending to work.
 */
export class NotImplementedError extends Error {
  constructor(featureName: string) {
    super(`Not implemented yet: ${featureName}`);
    this.name = "NotImplementedError";
  }
}
