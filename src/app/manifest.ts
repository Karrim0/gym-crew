import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gym Crew",
    short_name: "Gym Crew",
    description: "Personal and group workout tracking built for the gym floor.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070907",
    theme_color: "#070907",
    categories: ["fitness", "health", "productivity"],
    shortcuts: [
      {
        name: "Start workout",
        short_name: "Workout",
        description: "Open today's workout",
        url: "/workout/today",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Progress",
        short_name: "Progress",
        description: "Open personal analytics",
        url: "/progress",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Crew",
        short_name: "Crew",
        description: "Open your group",
        url: "/group",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
