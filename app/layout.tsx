import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import { TimerProvider } from "@/app/components/TimerContext";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Productivity Stopwatch",
  description: "Track your focus sessions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${lora.variable} ${dmSans.variable}`}>
      <body className="min-h-full bg-amber-50 text-stone-800" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <TimerProvider>{children}</TimerProvider>
      </body>
    </html>
  );
}
