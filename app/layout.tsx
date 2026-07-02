import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import SiteChrome from "./components/layout/SiteChrome";
import { getSettings } from "@/lib/settings";
import { getServices } from "@/lib/services";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MEPM — Building Services Consultants",
  description: "Multi-disciplinary electrical, mechanical and environmental engineering with sustainability at its core.",
  openGraph: {
    title: "MEPM — Building Services Consultants",
    description: "Engineering buildings that perform.",
    url: "https://mepm.co.uk",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { settings } = await getSettings();
  const services = await getServices(true).catch(() => []);
  return (
    <html
      lang="en"
      className={`scroll-smooth ${archivo.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased font-body">
        <SiteChrome settings={settings} services={services}>{children}</SiteChrome>
      </body>
    </html>
  );
}
