"use client";

import { GlowContainer } from "@/components/layout/GlowContainer";
import { DeepMarketAnalysis, MarketAnalysis } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { TrendingUp, CloudRain, Sun, Activity, HeartPulse } from "lucide-react";
import { NeonBadge } from "@/components/shared/NeonBadge";

interface MarketAnalysisPanelProps {
  data: MarketAnalysis | DeepMarketAnalysis | null;
}

export function MarketAnalysisPanel({ data }: MarketAnalysisPanelProps) {
  if (!data) return null;

  // Type guard or safe access for DeepMarketAnalysis properties
  const deepData = data as DeepMarketAnalysis;
  const { ethTrend, volatility, marketCondition, reasoning } = data;
  const fearGreedIndex = deepData.fearGreedIndex ?? 50;
  const fearGreedLabel = deepData.fearGreedLabel ?? "Neutral";
  const sentimentScore = deepData.sentimentScore ?? 0.5;

  const trendIcon = ethTrend === 'bullish' ? (
    <Sun className="w-5 h-5 text-neon-green" />
  ) : ethTrend === 'bearish' ? (
    <CloudRain className="w-5 h-5 text-neon-blue" />
  ) : (
    <TrendingUp className="w-5 h-5 text-yellow-400" />
  );

  const volatilityColor = volatility > 50 ? "red" : volatility > 20 ? "orange" : "green";

  // Fear & Greed Color
  const getFearGreedColor = (val: number) => {
    if (val <= 25) return "text-neon-orange"; // Extreme Fear
    if (val <= 45) return "text-yellow-500";  // Fear
    if (val <= 55) return "text-zinc-400";    // Neutral
    if (val <= 75) return "text-neon-green";  // Greed
    return "text-neon-cyan";                  // Extreme Greed
  };

  return (
    <GlowContainer glowColor="blue" intensity="medium" className="h-full flex flex-col justify-between p-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 border-b border-neon-blue/20 pb-4">
        <Activity className="w-6 h-6 text-neon-blue" />
        <h3 className="font-orbitron text-xl text-white tracking-wider">Market Intelligence</h3>
      </div>

      <div className="flex-1 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Trend Section */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest block">ETH Trend</span>
            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/10">
              {trendIcon}
              <span className={`text-base font-mono font-bold uppercase ${ethTrend === 'bullish' ? 'text-neon-green' : ethTrend === 'bearish' ? 'text-neon-blue' : 'text-yellow-400'}`}>
                {ethTrend}
              </span>
            </div>
          </div>

          {/* Volatility Section */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest block">Volatility</span>
            <div className="flex items-center gap-2 h-12">
              <NeonBadge label={formatPercent(volatility)} color={volatilityColor as any} size="lg" />
            </div>
          </div>

          {/* Fear & Greed Section */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest block">Sentiment</span>
            <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-col">
              <span className={`text-xl font-orbitron font-bold ${getFearGreedColor(fearGreedIndex)}`}>
                {fearGreedIndex}/100
              </span>
              <span className="text-[10px] text-zinc-400 font-mono uppercase">{fearGreedLabel}</span>
            </div>
          </div>

          {/* AI Sentiment Score */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest block">AI Sentiment</span>
             <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-center gap-2">
               <HeartPulse className={`w-5 h-5 ${sentimentScore > 0.6 ? 'text-neon-green' : sentimentScore < 0.4 ? 'text-neon-orange' : 'text-zinc-400'}`} />
               <span className="text-lg font-mono font-bold text-white">
                 {(sentimentScore * 10).toFixed(1)}/10
               </span>
             </div>
          </div>

        </div>

        {/* Market Condition Badge */}
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono uppercase tracking-widest pt-4 border-t border-white/5">
          <span>Market State</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${marketCondition === 'volatile' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
            {marketCondition.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Reasoning Footer */}
      <div className="mt-6 pt-4 border-t border-neon-blue/20">
        <p className="text-xs md:text-sm text-zinc-300 italic border-l-4 border-neon-blue/50 pl-4 py-2 bg-neon-blue/5 rounded-r-lg leading-relaxed font-mono">
          "{reasoning}"
        </p>
      </div>

    </GlowContainer>
  );
}
