"use client";

import { FinalRecommendation } from "@/lib/types";
import { formatAPY, cn } from "@/lib/utils";
import { ArrowRight, CheckCircle, Info, Loader2 } from "lucide-react";

interface FinalRecommendationCardProps {
  recommendation: FinalRecommendation;
  onExecute?: () => void;
  isExecuting?: boolean;
}

const actionBorderColor: Record<string, string> = {
  add_liquidity: "#F59E0B", // amber
  swap: "#3B82F6", // blue
  hold: "#8B5CF6", // violet
};

const actionLabel: Record<string, string> = {
  add_liquidity: "Provide Liquidity",
  swap: "Execute Swap",
  hold: "Hold Position",
};

export function FinalRecommendationCard({
  recommendation,
  onExecute,
  isExecuting = false,
}: FinalRecommendationCardProps) {
  const { action, expectedAPY, maxRisk, confidence, explanation } = recommendation;

  const borderColor = actionBorderColor[action] || "#8B5CF6";

  return (
    <div
      className="glass-card p-8 w-full max-w-4xl mx-auto overflow-hidden relative"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Background Glow */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/4"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
        {/* Left: Action & badges */}
        <div className="flex-1 space-y-5">
          <h2 className="font-sans font-bold text-[2rem] text-white tracking-tight">
            {actionLabel[action]}
          </h2>

          {/* Badge row */}
          <div className="flex flex-wrap gap-3">
            <span className="glass-card border-none bg-[rgba(255,255,255,0.04)] text-emerald-400 text-sm font-mono rounded-lg px-3 py-1.5 flex items-center shadow-none">
              APY <span className="text-white ml-1.5">{formatAPY(expectedAPY)}</span>
            </span>
            <span className="glass-card border-none bg-[rgba(255,255,255,0.04)] text-red-400 text-sm font-mono rounded-lg px-3 py-1.5 flex items-center shadow-none">
              Risk <span className="text-white ml-1.5">{((maxRisk || 0) * 100).toFixed(1)}%</span>
            </span>
            <span className="glass-card border-none bg-[rgba(255,255,255,0.04)] text-violet-400 text-sm font-mono rounded-lg px-3 py-1.5 flex items-center shadow-none">
              Confidence <span className="text-white ml-1.5">{((confidence || 0) * 100).toFixed(0)}%</span>
            </span>
          </div>

          {/* Explanation */}
          <p className="text-sm text-[#8A8F98] border-l-2 border-[#1A1A24] pl-4 leading-relaxed max-w-xl font-sans">
            {explanation}
          </p>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col items-end gap-3 min-w-[200px]">
          {action !== "hold" ? (
            <button
              onClick={onExecute}
              disabled={isExecuting}
              className={cn(
                "bg-[#8B5CF6] text-white font-semibold rounded-xl px-8 py-4 flex items-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
                "hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  Execute On-Chain
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-violet-400 text-sm font-medium bg-violet-500/10 px-4 py-2 rounded-xl">
              <CheckCircle className="w-4 h-4" />
              <span>Optimal state verified</span>
            </div>
          )}

          <div className="text-xs text-[#4A4F5A] flex items-center gap-1.5 mt-2">
            <Info className="w-3.5 h-3.5" />
            <span>Gas estimate: ~0.004 ETH</span>
          </div>
        </div>
      </div>
    </div>
  );
}