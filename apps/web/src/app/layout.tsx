import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import "../styles/tailwind.css";
import "../styles/style.css";
import { ClientRoot } from "./client-root";

export const metadata: Metadata = {
  title: "FinTrack | Finance Tracker",
  icons: {
    icon: "./logo.png",
    shortcut: "./logo.png",
    apple: "./logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
