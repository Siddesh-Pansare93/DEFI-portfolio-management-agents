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
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(5,5,5,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]">
      <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-sans font-semibold text-sm text-[#EDEDEF]">
            Autonomous DeFi
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          <span className="font-sans text-xs text-[#4A4F5A]">
            Neural Agents
          </span>
        </Link>

        {/* Right: Wallet + Health */}
        <div className="flex items-center gap-3">
          {isConnected && address ? (
            <button
              onClick={() => disconnect()}
              className="font-mono text-xs text-[#8A8F98] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-full px-3 py-1 hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
            >
              {formatAddress(address)}
            </button>
          ) : (
            <Button
              variant="default"
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-white hover:bg-[rgba(255,255,255,0.06)] text-xs rounded-full px-3 py-1 transition-colors h-7"
              disabled={isPending}
              onClick={handleConnect}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <Wallet className="w-3 h-3 mr-1.5 text-violet-400" />
              )}
              {isPending ? "Connecting..." : "Connect"}
            </Button>
          )}

          {/* Health indicator dot */}
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isBackendHealthy ? "bg-emerald-400 animate-pulse" : "bg-red-400"
            }`}
            title={isBackendHealthy ? "Backend online" : "Backend offline"}
          />
        </div>
      </div>
    </nav>
  );
}