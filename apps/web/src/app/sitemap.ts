import type { MetadataRoute } from "next";
import { APP_BASE_PATH } from "@/config/constants";

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:5173";
const BASE_URL = `${SITE_ORIGIN}${APP_BASE_PATH}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
