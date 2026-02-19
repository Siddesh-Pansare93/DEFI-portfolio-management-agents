"use client";

import { GlowContainer } from "@/components/layout/GlowContainer";
import { MarketAnalysis } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { TrendingUp, AlertTriangle, CloudRain, Sun } from "lucide-react";
import { NeonBadge } from "@/components/shared/NeonBadge";

interface MarketAnalysisPanelProps {
  data: MarketAnalysis | null;
}

export function MarketAnalysisPanel({ data }: MarketAnalysisPanelProps) {
  if (!data) return null;

  const { ethTrend, volatility, marketCondition, reasoning } = data;

  const trendIcon = ethTrend === "bullish" ? <Sun className="w-5 h-5 text-neon-yellow" /> : <CloudRain className="w-5 h-5 text-neon-blue" />;
  const volatilityColor = volatility > 0.5 ? "red" : volatility > 0.3 ? "orange" : "green";

  return (
    <GlowContainer glowColor="blue" intensity="low" className="p-6 h-full flex flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <TrendingUp className="text-neon-blue w-5 h-5" />
        <h3 className="font-orbitron text-lg text-white tracking-wider">Market Intelligence</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Trend */}
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">ETH Trend</span>
          <div className="flex items-center gap-2">
            {trendIcon}
            <span className={`text-lg font-mono font-bold uppercase ${ethTrend === 'bullish' ? 'text-neon-green' : 'text-neon-blue'}`}>
              {ethTrend}
            </span>
          </div>
        </div>

        {/* Volatility */}
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Volatility</span>
          <div className="flex items-center gap-2">
            <NeonBadge label={formatPercent(volatility)} color={volatilityColor as any} size="md" />
          </div>
        </div>
      </div>

      {/* Market Condition */}
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono uppercase tracking-widest">
          <span>Market State</span>
          <span className={`px-2 py-0.5 rounded bg-white/5 border border-white/10 ${marketCondition === 'volatile' ? 'text-red-400' : 'text-green-400'}`}>
            {marketCondition.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-zinc-300 italic border-l-2 border-neon-blue/30 pl-3 leading-relaxed">
          "{reasoning}"
        </p>
      </div>
    </GlowContainer>
  );
}
