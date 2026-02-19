import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, JetBrains_Mono } from "next/font/google";
import { CyberpunkBackground } from "@/components/layout/CyberpunkBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
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
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-bg-void text-foreground selection:bg-neon-cyan/30 selection:text-neon-cyan`}
      >
        <CyberpunkBackground />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
