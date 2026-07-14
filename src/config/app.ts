/**
 * App-wide metadata, referenced by `src/app/layout.tsx` and
 * `src/app/manifest.ts` so the app name/description only need to change in
 * one place.
 */
export const APP_CONFIG = {
  name: "Gym Crew",
  description: "Group workout tracking for you and your friends.",
} as const;
