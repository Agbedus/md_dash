import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/sidebar";
import TopNav from "@/components/ui/topnav";
import Content from "@/components/ui/content";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MD Platform",
  description: "A bespoke, secure, and intelligent productivity platform.",
};

import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen">
          <Sidebar user={session?.user} />
          <div className="flex-1 flex flex-col">
            <TopNav user={session?.user} />
            <Content>{children}</Content>
          </div>
        </div>
      </body>
    </html>
  );
}
