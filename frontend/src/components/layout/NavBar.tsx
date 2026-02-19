"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavBar() {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("http://localhost:3001/health");
        if (res.ok) {
          setIsBackendHealthy(true);
        } else {
          setIsBackendHealthy(false);
        }
        setLastChecked(new Date());
      } catch (error) {
        setIsBackendHealthy(false);
      }
    };

    // Initial check
    checkHealth();

    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-mono tracking-tighter text-xl font-bold text-white hover:text-neon-cyan transition-colors">
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_10px_#00ffff]" />
          AUTONOMOUS.DEFI
        </Link>

        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>SYSTEM STATUS:</span>
            <div className="flex items-center gap-1.5">
              <div 
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-500",
                  isBackendHealthy ? "bg-neon-green shadow-[0_0_8px_#00ff88]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"
                )} 
              />
              <span className={isBackendHealthy ? "text-neon-green" : "text-red-500"}>
                {isBackendHealthy ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
          
          <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
          
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
             <span>NETWORK: SEPOLIA</span>
             <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          </div>
        </div>
      </div>
    </nav>
  );
}
