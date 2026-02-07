import type { Metadata } from "next";
import { Inter, Sarabun, Prompt, Noto_Sans_Thai, IBM_Plex_Sans_Thai, Pridi } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Clean, readable Thai font
const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

// Modern, geometric Thai font
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

// Google's universal Thai font - neutral & clean
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
});

// IBM's technical Thai font - modern & professional
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm",
});

// Elegant serif Thai font - classic & sophisticated
const pridi = Pridi({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-pridi",
});

export const metadata: Metadata = {
  title: {
    default: "Sellio - ขายของออนไลน์ง่ายๆ ผ่านลิงก์เดียว",
    template: "%s | Sellio",
  },
  description: "แพลตฟอร์มขายสินค้าดิจิทัลสำหรับ Content Creator ไทย ไม่ต้องตอบแชท ไม่ต้องมีเว็บไซต์ เริ่มขายได้ทันที",
  keywords: ["ขายของออนไลน์", "content creator", "สินค้าดิจิทัล", "ขายผ่านลิงก์", "Sellio", "stan store ไทย", "creator store"],
  authors: [{ name: "Sellio" }],
  creator: "Sellio",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sellio.me"),
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "Sellio",
    title: "Sellio - ขายของออนไลน์ง่ายๆ ผ่านลิงก์เดียว",
    description: "แพลตฟอร์มขายสินค้าดิจิทัลสำหรับ Content Creator ไทย ไม่ต้องตอบแชท ไม่ต้องมีเว็บไซต์ เริ่มขายได้ทันที",
    images: [{ url: "/logo-black.png", width: 1000, height: 500, alt: "Sellio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sellio - ขายของออนไลน์ง่ายๆ ผ่านลิงก์เดียว",
    description: "แพลตฟอร์มขายสินค้าดิจิทัลสำหรับ Content Creator ไทย",
    images: ["/logo-black.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${sarabun.variable} ${prompt.variable} ${notoSansThai.variable} ${ibmPlexSansThai.variable} ${pridi.variable} font-sans antialiased bg-white text-black`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
