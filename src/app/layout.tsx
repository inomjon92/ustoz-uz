import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Ustoz.uz — ta'lim ekotizimi", template: "%s · Ustoz.uz" },
  description: "Repetitorlar, o'quv markazlari, onlayn kurslar, testlar va sertifikatlar bir joyda.",
  appleWebApp: { capable: true, title: "Ustoz.uz", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#2453e0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
