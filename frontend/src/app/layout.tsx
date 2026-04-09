import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Web3Provider } from "@/components/wallet/Web3Provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Autonomous DeFi | Neural Agents",
  description: "AI agents that think, debate, and execute",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-[#050505] text-foreground selection:bg-violet-500/30 selection:text-violet-200`}
      >
        <Web3Provider>
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  );
}