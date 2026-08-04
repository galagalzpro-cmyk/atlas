import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./audience.css";
import "./conversation.css";

export const metadata: Metadata = {
  title: "ATLAS — Intelligence émotionnelle vivante",
  description:
    "ATLAS transforme les moments complexes en compréhension, orientation et prochain pas concret.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1eadf",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
