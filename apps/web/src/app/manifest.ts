import type { MetadataRoute } from "next";
import { APP_BASE_PATH } from "@/config/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinTrack - Personal Finance Tracker",
    short_name: "FinTrack",
    description:
      "Personal finance tracker with transaction analytics, Monobank import, and AI insights.",
    start_url: `${APP_BASE_PATH}/dashboard`,
    scope: `${APP_BASE_PATH}/`,
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0f172a",
    icons: [
      {
        src: `${APP_BASE_PATH}/logo.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${APP_BASE_PATH}/logo.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
