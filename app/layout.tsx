import type { Metadata } from "next";
import { Inter, Sarabun, Prompt, Noto_Sans_Thai, IBM_Plex_Sans_Thai, Pridi } from "next/font/google";
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
  title: "Sellio",
  description: "ขายของออนไลน์ผ่านลิงก์เดียว สำหรับ Content Creator ไทย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${sarabun.variable} ${prompt.variable} ${notoSansThai.variable} ${ibmPlexSansThai.variable} ${pridi.variable} font-sans antialiased bg-white text-black`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
