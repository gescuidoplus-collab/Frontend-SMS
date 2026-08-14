import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LoadingOverlay from "@/components/LoadingOverlay";
import AntdCompatPatch from "@/components/AntdCompatPatch";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CuidoFam",
  description: "Vizualizador de SMS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #ffffff; display: flex; align-items: center; justify-content: center; z-index: 9999; }
          .spinner { width: 50px; height: 50px; border: 4px solid #f0f0f0; border-top: 4px solid #1677ff; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <AntdCompatPatch />
        <LoadingOverlay />
        {children}
      </body>
    </html>
  );
}
