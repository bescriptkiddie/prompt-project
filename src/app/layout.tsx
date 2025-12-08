import type { Metadata } from "next";
import { Inter, Noto_Serif_SC, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Prompt 灵感工坊 | 人文主义创意库",
  description: "为计算创意而生的精选提示词库",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${notoSerifSC.variable} ${playfairDisplay.variable} antialiased h-screen overflow-hidden flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
