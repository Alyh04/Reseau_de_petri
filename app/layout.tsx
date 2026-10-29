import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulation Réseau de Petri — Carrefour à 4 directions",
  description:
    "Simulation interactive d'un carrefour à quatre directions (NS/EO) modélisé par un réseau de Petri : feux tricolores, files d'attente et analyse formelle.",
  applicationName: "Petri Traffic",
  keywords: [
    "réseau de Petri",
    "feux tricolores",
    "simulation",
    "carrefour",
    "Next.js",
    "M1",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f6f9",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
