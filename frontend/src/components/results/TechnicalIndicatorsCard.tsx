"use client";

import { TechnicalIndicators } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TechnicalIndicatorsCardProps {
  indicators: TechnicalIndicators;
}

export function TechnicalIndicatorsCard({ indicators }: TechnicalIndicatorsCardProps) {
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "strong_buy":
        return "text-neon-green border-neon-green/50 bg-neon-green/10";
      case "buy":
        return "text-green-400 border-green-400/50 bg-green-400/10";
      case "hold":
        return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10";
      case "sell":
        return "text-orange-400 border-orange-400/50 bg-orange-400/10";
      case "strong_sell":
        return "text-neon-orange border-neon-orange/50 bg-neon-orange/10";
      default:
        return "text-zinc-400 border-zinc-600 bg-zinc-800/50";
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return "text-neon-orange"; // Overbought
    if (rsi <= 30) return "text-neon-green"; // Oversold
    return "text-yellow-400"; // Neutral
  };

  const getRSILabel = (rsi: number) => {
    if (rsi >= 70) return "Overbought";
    if (rsi <= 30) return "Oversold";
    return "Neutral";
  };

  return (
    <Card className="p-6 bg-black/40 border-white/10 backdrop-blur-md h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <div className="p-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
          <BarChart3 className="w-5 h-5 text-neon-purple" />
        </div>
        <h3 className="font-orbitron text-lg text-white font-bold">
          Technical Analysis
        </h3>
      </div>

      <div className="flex-1 space-y-6">
        {/* Overall Signal */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider">
            Trading Signal
          </span>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold font-mono uppercase border",
              getSignalColor(indicators.signal)
            )}
          >
            {indicators.signal.replace("_", " ")}
          </span>
        </div>

        {/* RSI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-zinc-400">
              RSI (Relative Strength)
            </span>
            <span className={cn("text-sm font-bold font-mono", getRSIColor(indicators.rsi))}>
              {indicators.rsi.toFixed(2)}
            </span>
          </div>
          <div className="relative w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute left-0 top-0 h-full rounded-full transition-all",
                getRSIColor(indicators.rsi).replace("text-", "bg-")
              )}
              style={{ width: `${Math.min(indicators.rsi, 100)}%` }}
            />
            {/* Markers for 30 and 70 */}
            <div className="absolute left-[30%] top-0 w-px h-full bg-white/20" />
            <div className="absolute left-[70%] top-0 w-px h-full bg-white/20" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-600">
            <span>0</span>
            <span>30</span>
            <span>70</span>
            <span>100</span>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Status: <span className={getRSIColor(indicators.rsi)}>{getRSILabel(indicators.rsi)}</span>
          </p>
        </div>

        {/* MACD */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-mono text-white font-bold">MACD</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <div className="text-zinc-500 mb-1">Value</div>
              <div className={cn("font-bold", indicators.macd.value >= 0 ? "text-neon-green" : "text-neon-orange")}>
                {indicators.macd.value.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Signal</div>
              <div className="text-white font-bold">{indicators.macd.signal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Histogram</div>
              <div className={cn("font-bold", indicators.macd.histogram >= 0 ? "text-neon-green" : "text-neon-orange")}>
                {indicators.macd.histogram.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-neon-purple" />
            <span className="text-sm font-mono text-white font-bold">Bollinger Bands</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">Upper Band</span>
              <span className="text-neon-orange font-bold">${indicators.bollingerBands.upper.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Middle (SMA)</span>
              <span className="text-white font-bold">${indicators.bollingerBands.middle.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Lower Band</span>
              <span className="text-neon-green font-bold">${indicators.bollingerBands.lower.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-zinc-500">%B Position</span>
              <span className="text-neon-cyan font-bold">
                {(indicators.bollingerBands.percentB * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* EMAs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">EMA 7</div>
            <div className="text-lg font-bold font-mono text-white">
              ${indicators.ema7.toFixed(2)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">EMA 30</div>
            <div className="text-lg font-bold font-mono text-white">
              ${indicators.ema30.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">Short-term Trend</span>
          <div className="flex items-center gap-2">
            {indicators.ema7 > indicators.ema30 ? (
              <>
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <span className="text-xs font-bold font-mono text-neon-green">BULLISH</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-neon-orange" />
                <span className="text-xs font-bold font-mono text-neon-orange">BEARISH</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
