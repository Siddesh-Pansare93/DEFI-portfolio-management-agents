import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Web3Provider } from "@/components/wallet/Web3Provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Autonomous DeFi | AI Agent Pipeline",
  description: "Real-time AI-driven DeFi strategy visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-[#0F172A] text-foreground selection:bg-amber-500/30 selection:text-amber-200`}
      >
        <Web3Provider>
          {/* Ambient background blobs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div
              className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-amber-500/5 blur-[120px] animate-ambient-float"
            />
            <div
              className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full bg-violet-500/5 blur-[120px] animate-ambient-float"
              style={{ animationDelay: "-10s" }}
            />
          </div>
          <div className="relative z-10">
            {children}
          </div>
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  );
}
