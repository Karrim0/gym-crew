# App icons

This folder is a placeholder. Add the following PWA icon files before shipping:

| File | Size | Purpose |
| --- | --- | --- |
| `icon-192x192.png` | 192×192 | Referenced by `src/app/manifest.ts`, Android home screen |
| `icon-512x512.png` | 512×512 | Referenced by `src/app/manifest.ts`, splash screens |
| `icon-maskable-192x192.png` | 192×192 | Optional, `purpose: "maskable"` variant for adaptive icons |
| `icon-maskable-512x512.png` | 512×512 | Optional, `purpose: "maskable"` variant for adaptive icons |
| `apple-touch-icon.png` | 180×180 | iOS home screen icon |

All icons should be square PNGs with no transparency for the non-maskable
variants. Maskable icons need at least 40% padding around the safe zone per
the [maskable.app](https://maskable.app/) guidelines.
