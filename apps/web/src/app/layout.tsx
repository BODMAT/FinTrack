import "leaflet/dist/leaflet.css";
import type { Metadata, Viewport } from "next";
import "../styles/tailwind.css";
import "../styles/style.css";
import { ClientRoot } from "./client-root";
import { APP_BASE_PATH } from "@/config/constants";

const SITE_NAME = "FinTrack";
const SITE_TITLE = "FinTrack — Personal Finance Tracker";
const SITE_DESCRIPTION =
  "Track expenses and income, import Monobank transactions, and get AI-powered finance insights in one secure dashboard.";
const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:5173";
const OG_IMAGE_PATH = `${APP_BASE_PATH}/og/fintrack-preview.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: "%s | FinTrack",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "personal finance",
    "expense tracker",
    "budget planner",
    "monobank",
    "ai analytics",
    "fintrack",
  ],
  alternates: {
    canonical: APP_BASE_PATH,
  },
  openGraph: {
    type: "website",
    url: APP_BASE_PATH,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "FinTrack dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  manifest: `${APP_BASE_PATH}/manifest.webmanifest`,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: `${APP_BASE_PATH}/logo.png`,
    shortcut: `${APP_BASE_PATH}/logo.png`,
    apple: `${APP_BASE_PATH}/logo.png`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
