import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "./components/layout";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
