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
  add_liquidity: "#F59E0B",
  swap: "#3B82F6",
  hold: "#8B5CF6",
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
      className="bg-[#222735] border border-[#334155] rounded-2xl p-8 w-full max-w-4xl mx-auto"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        {/* Left: Action & badges */}
        <div className="flex-1 space-y-5">
          <h2 className="font-sans font-bold text-2xl text-white tracking-tight">
            {actionLabel[action]}
          </h2>

          {/* Badge row */}
          <div className="flex flex-wrap gap-3">
            <span className="bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-lg px-3 py-1">
              APY {formatAPY(expectedAPY)}
            </span>
            <span className="bg-red-500/10 text-red-400 text-sm font-medium rounded-lg px-3 py-1">
              Risk {((maxRisk || 0) * 100).toFixed(1)}%
            </span>
            <span className="bg-violet-500/10 text-violet-400 text-sm font-medium rounded-lg px-3 py-1">
              Confidence {((confidence || 0) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Explanation */}
          <p className="text-sm text-[#94A3B8] border-l-2 border-[#334155] pl-4 leading-relaxed max-w-xl">
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
                "bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl px-8 py-3 flex items-center gap-2 transition-all duration-200",
                "hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  Execute On-Chain
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-violet-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Optimal state verified</span>
            </div>
          )}

          <div className="text-xs text-[#64748B] flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Gas estimate: ~0.004 ETH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
