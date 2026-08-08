import type { Metadata, Viewport } from "next";
import AtlasPresenceRuntimeBridge from "../components/atlas/lounge/AtlasPresenceRuntimeBridge";
import "./globals.css";
import "./site.css";
import "./audience.css";
import "./conversation.css";
import "./journey.css";
import "./portal.css";

export const metadata: Metadata = {
  title: "ATLAS — Intelligence émotionnelle vivante",
  description:
    "ATLAS transforme les moments complexes en compréhension, orientation et prochain pas concret.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
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
      <body>
        {children}
        <AtlasPresenceRuntimeBridge />
      </body>
    </html>
  );
}
