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
  icons: {
    icon: "/logo.svg",
  },
};

import { auth } from "@/auth";
import { Toaster } from 'react-hot-toast';
import { TaskTimerProvider } from '@/providers/task-timer-provider';
import { TaskTimerUI } from '@/components/ui/tasks/task-timer-ui';
import { LocationProvider } from '@/providers/location-provider';
import { getMyAttendanceToday } from '@/app/attendance/actions';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const initialAttendance = session ? await getMyAttendanceToday() : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TaskTimerProvider>
          <LocationProvider initialRecord={initialAttendance}>
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
          </LocationProvider>
        </TaskTimerProvider>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(24, 24, 27, 0.9)',
              color: '#a1a1aa', // light grey (zinc-400)
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              padding: '12px 20px',
              fontSize: '11px',
              fontWeight: '500',
              borderRadius: '16px',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
          }} 
        />
      </body>
    </html>
  );
}
