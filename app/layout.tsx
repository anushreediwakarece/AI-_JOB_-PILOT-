import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { SessionGate } from "@/components/SessionGate";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Runs before paint: applies the saved theme (default dark) so there's no flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark')}else{d.classList.add('dark')}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "JobPilot — AI-Powered Job Hunting Assistant",
  description:
    "Find relevant jobs, get intelligent match scores, and research companies — all powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <PostHogProvider>
          <SessionGate>{children}</SessionGate>
        </PostHogProvider>
      </body>
    </html>
  );
}
