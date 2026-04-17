import type { MetadataRoute } from "next";
import { APP_BASE_PATH } from "@/config/constants";

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:5173";
const BASE_URL = `${SITE_ORIGIN}${APP_BASE_PATH}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [APP_BASE_PATH],
        disallow: [
          `${APP_BASE_PATH}/api/`,
          `${APP_BASE_PATH}/admin`,
          `${APP_BASE_PATH}/dashboard`,
          `${APP_BASE_PATH}/analytics`,
          `${APP_BASE_PATH}/transactions`,
          `${APP_BASE_PATH}/monobank`,
          `${APP_BASE_PATH}/donation`,
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
