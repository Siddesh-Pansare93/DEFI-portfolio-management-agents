"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const handleConnect = () => {
    const connector =
      connectors.find((c) => c.id === "injected") || connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("http://localhost:3001/health");
        setIsBackendHealthy(res.ok);
      } catch {
        setIsBackendHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-sans font-semibold text-lg text-white">
            Autonomous DeFi
          </span>
          <span className="text-[#334155] text-sm select-none">&middot;</span>
          <span className="text-[#94A3B8] text-sm">AI Agents</span>
        </Link>

        {/* Right: Wallet + Health */}
        <div className="flex items-center gap-3">
          {isConnected && address ? (
            <button
              onClick={() => disconnect()}
              className="font-mono text-sm text-[#94A3B8] bg-[#222735] border border-[#334155] rounded-lg px-3 py-1.5 hover:border-[#475569] transition-colors cursor-pointer"
            >
              {formatAddress(address)}
            </button>
          ) : (
            <Button
              variant="default"
              className="bg-[#222735] border border-[#334155] text-white hover:bg-[#2a3040] text-sm rounded-lg px-3 py-1.5 transition-colors"
              disabled={isPending}
              onClick={handleConnect}
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Wallet className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isPending ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}

          {/* Health indicator dot */}
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isBackendHealthy ? "bg-emerald-400" : "bg-red-400"
            }`}
            title={isBackendHealthy ? "Backend online" : "Backend offline"}
          />
        </div>
      </div>
    </nav>
  );
}
