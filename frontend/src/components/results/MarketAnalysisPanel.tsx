"use client";

import { MarketAnalysis } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { NeuralCard, CardLabel } from "@/components/ui/neural-card";

interface MarketAnalysisPanelProps {
  data: MarketAnalysis | null;
}

const trendColors: Record<string, string> = {
  bullish: "bg-emerald-500/10 text-emerald-400",
  bearish: "bg-red-500/10 text-red-400",
  neutral: "bg-amber-500/10 text-amber-400",
};

const conditionColors: Record<string, string> = {
  stable: "bg-emerald-500/10 text-emerald-400",
  volatile: "bg-red-500/10 text-red-400",
  uncertain: "bg-amber-500/10 text-amber-400",
};

export function MarketAnalysisPanel({ data }: MarketAnalysisPanelProps) {
  if (!data) return null;

  const { ethTrend, volatility, marketCondition, reasoning } = data;

  return (
    <NeuralCard accentColor="#6366F1" className="h-full">
      <div className="p-6 h-full flex flex-col">
      <CardLabel className="mb-5 block">Market Analysis</CardLabel>

      <div className="flex-1 space-y-4">
        {/* Badges grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* ETH Trend */}
          <div className="space-y-1.5">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block">
              ETH Trend
            </span>
            <span
              className={`inline-block rounded-lg px-3 py-1 text-sm font-medium capitalize ${
                trendColors[ethTrend] || trendColors.neutral
              }`}
            >
              {ethTrend}
            </span>
          </div>

          {/* Volatility */}
          <div className="space-y-1.5">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block">
              Volatility
            </span>
            <span
              className={`inline-block rounded-lg px-3 py-1 text-sm font-medium font-mono ${
                volatility > 50
                  ? "bg-red-500/10 text-red-400"
                  : volatility > 20
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {formatPercent(volatility)}
            </span>
          </div>

          {/* Market Condition */}
          <div className="space-y-1.5">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block">
              Market State
            </span>
            <span
              className={`inline-block rounded-lg px-3 py-1 text-sm font-medium capitalize ${
                conditionColors[marketCondition] || conditionColors.uncertain
              }`}
            >
              {marketCondition}
            </span>
          </div>

          {/* Sentiment / Recommendation */}
          <div className="space-y-1.5">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block">
              Sentiment
            </span>
            <span className="inline-block rounded-lg px-3 py-1 text-sm font-medium font-mono bg-violet-500/10 text-violet-400 capitalize">
              {data.recommendation?.replace(/_/g, " ") || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="mt-5 pt-4 border-t border-[#334155]">
          <p className="text-sm text-[#94A3B8] border-l-2 border-[#334155] pl-4 leading-relaxed">
            {reasoning}
          </p>
        </div>
      )}
    </div>
    </NeuralCard>
  );
}
