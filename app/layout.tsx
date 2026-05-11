import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Silkscreen } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
});

export const metadata: Metadata = {
  title: "Crypto Tap",
  description: "Крипто-тапалка в Telegram: майнинг, апгрейды, цели",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${silkscreen.variable} min-h-dvh antialiased`}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-dvh w-full max-w-[100vw] flex-col overflow-x-hidden bg-[#0c0e14] text-amber-50 antialiased"
      >
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}