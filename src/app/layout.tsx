import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/sidebar";
import TopNav from "@/components/ui/topnav";
import Content from "@/components/ui/content";
import DashboardLayout from "@/components/ui/dashboard-layout";

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
import { Toaster } from 'react-hot-toast';
import { TaskTimerProvider } from '@/providers/task-timer-provider';
import { TaskTimerUI } from '@/components/ui/tasks/task-timer-ui';

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
        <TaskTimerProvider>
          {session ? (
            <DashboardLayout 
              sidebar={<Sidebar user={session?.user} />}
              topnav={<TopNav user={session?.user} />}
              user={session?.user}
            >
              {children}
            </DashboardLayout>
          ) : (
            <div className="min-h-screen bg-zinc-950">
              {children}
            </div>
          )}
          <TaskTimerUI />
        </TaskTimerProvider>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }} />
      </body>
    </html>
  );
}
