"use client";

import { GlowContainer } from "@/components/layout/GlowContainer";
import { PortfolioData } from "@/lib/types";
import { formatUSD, formatPercent, cn } from "@/lib/utils";
import { Database, Activity, RefreshCw } from "lucide-react";

interface PortfolioSnapshotProps {
  data: PortfolioData | null;
}

export function PortfolioSnapshot({ data }: PortfolioSnapshotProps) {
  if (!data) return null;

  const { holdings, totalValueUSD, allocationPercent, uniswapPool } = data;

  return (
    <GlowContainer glowColor="cyan" intensity="low" className="flex flex-col gap-6 p-6 h-full">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Database className="text-neon-cyan w-5 h-5" />
        <h3 className="font-orbitron text-lg text-white tracking-wider">Portfolio State</h3>
      </div>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
        {/* Total Value */}
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Total Value</span>
          <div className="text-2xl font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            {formatUSD(totalValueUSD)}
          </div>
        </div>

        {/* ETH Allocation */}
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">ETH Allocation</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-neon-cyan rounded-full shadow-[0_0_8px_#00ffff]" />
            <span className="text-lg font-mono font-bold text-neon-cyan">
              {formatPercent(allocationPercent.ETH)}
            </span>
          </div>
        </div>

        {/* USDC Allocation */}
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">USDC Allocation</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-[#ff00ff] rounded-full shadow-[0_0_8px_#ff00ff]" />
            <span className="text-lg font-mono font-bold text-[#ff00ff]">
              {formatPercent(allocationPercent.USDC)}
            </span>
          </div>
        </div>

        {/* Pool Activity */}
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Pool Volume (24h)</span>
          <div className="flex items-center gap-2 text-zinc-300">
            <Activity className="w-4 h-4 text-zinc-500" />
            <span className="font-mono">{formatUSD(uniswapPool.volume24h)}</span>
          </div>
        </div>
      </div>
    </GlowContainer>
  );
}
