import "leaflet/dist/leaflet.css";
import "../styles/tailwind.css";
import "../styles/style.css";
import { ClientRoot } from "./client-root";

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


