import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
import { getMyAttendanceToday } from '@/app/(dashboard)/attendance/actions';
import { CookiePopup } from '@/components/ui/cookie-popup';

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
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <TaskTimerProvider>
          <LocationProvider initialRecord={initialAttendance}>
            <div className="min-h-screen bg-zinc-950">
              {children}
            </div>
            <TaskTimerUI />
            <CookiePopup />
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
