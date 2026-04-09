"use client";

import { useState } from "react";
import { WorkflowState } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/utils";
import {
  Database,
  TrendingUp,
  Lightbulb,
  Shield,
  Scale,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

interface WorkflowSummaryProps {
  state: WorkflowState | null;
}

interface AgentSectionProps {
  icon: React.ReactNode;
  label: string;
  isComplete: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AgentSection({ icon, label, isComplete, children, defaultOpen = false }: AgentSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#334155] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium text-white tracking-wide">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1">
          <div className="bg-[#1a1f2e] rounded-xl p-4 text-sm">{children}</div>
        </div>
      )}
    </div>
  );
}

export function WorkflowSummary({ state }: WorkflowSummaryProps) {
  if (!state) return null;

  const {
    portfolio,
    marketAnalysis,
    strategyProposal,
    riskValidation,
    finalRecommendation,
  } = state;

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl w-full max-w-4xl mx-auto mt-10 mb-16 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#334155]">
        <h3 className="uppercase tracking-wider text-[#64748B] text-xs font-semibold">
          Agent Execution Trace
        </h3>
      </div>

      {/* Data Collector */}
      <AgentSection
        icon={<Database className="w-4 h-4 text-sky-400" />}
        label="Data Collector"
        isComplete={!!portfolio}
      >
        <div className="grid grid-cols-2 gap-4 text-[#94A3B8]">
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Portfolio Value</span>
            <span className="font-mono text-white">
              {formatUSD(portfolio?.totalValueUSD || 0)}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-1">ETH Balance</span>
            <span className="font-mono text-white">
              {portfolio?.holdings.ETH.balance.toFixed(4)} ETH
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-1">USDC Balance</span>
            <span className="font-mono text-white">
              {formatUSD(portfolio?.holdings.USDC.balance || 0)}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Pool Liquidity</span>
            <span className="font-mono text-white">
              {formatUSD(portfolio?.uniswapPool.liquidity || 0)}
            </span>
          </div>
        </div>
      </AgentSection>

      {/* Market Analyzer */}
      <AgentSection
        icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
        label="Market Analyzer"
        isComplete={!!marketAnalysis}
      >
        <div className="grid grid-cols-2 gap-4 text-[#94A3B8]">
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Trend</span>
            <span
              className={`font-mono font-medium capitalize ${
                marketAnalysis?.ethTrend === "bullish"
                  ? "text-emerald-400"
                  : marketAnalysis?.ethTrend === "bearish"
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              {marketAnalysis?.ethTrend}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Volatility (30d)</span>
            <span className="font-mono text-white">
              {formatPercent(marketAnalysis?.volatility || 0)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-[#64748B] text-xs block mb-1">Reasoning</span>
            <p className="text-[#94A3B8] text-sm italic leading-relaxed">
              {marketAnalysis?.reasoning}
            </p>
          </div>
        </div>
      </AgentSection>

      {/* Strategy Proposer */}
      <AgentSection
        icon={<Lightbulb className="w-4 h-4 text-amber-400" />}
        label="Strategy Proposer"
        isComplete={!!strategyProposal}
      >
        <div className="grid grid-cols-2 gap-4 text-[#94A3B8]">
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Proposed Action</span>
            <span className="font-mono text-amber-400 font-medium uppercase">
              {strategyProposal?.action.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Est. APY</span>
            <span className="font-mono text-emerald-400">
              {formatPercent(strategyProposal?.expectedAPY || 0)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-[#64748B] text-xs block mb-1">Logic</span>
            <p className="text-[#94A3B8] text-sm italic leading-relaxed">
              {strategyProposal?.reasoning}
            </p>
          </div>
        </div>
      </AgentSection>

      {/* Risk Validator */}
      <AgentSection
        icon={<Shield className="w-4 h-4 text-orange-400" />}
        label="Risk Validator"
        isComplete={!!riskValidation}
      >
        <div className="grid grid-cols-2 gap-4 text-[#94A3B8]">
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Status</span>
            <span
              className={`font-mono font-medium ${
                riskValidation?.approved ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {riskValidation?.approved ? "Approved" : "Rejected"}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Risk Score</span>
            <span
              className={`font-mono font-medium ${
                (riskValidation?.riskScore || 0) > 0.5
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {((riskValidation?.riskScore || 0) * 100).toFixed(1)}/100
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-[#64748B] text-xs block mb-1">Analysis</span>
            <p className="text-[#94A3B8] text-sm italic leading-relaxed">
              {riskValidation?.reasoning}
            </p>
            {riskValidation?.violations && riskValidation.violations.length > 0 && (
              <p className="mt-2 text-red-400 text-sm">
                Violations: {riskValidation.violations.join(", ")}
              </p>
            )}
          </div>
        </div>
      </AgentSection>

      {/* Nash Negotiator */}
      <AgentSection
        icon={<Scale className="w-4 h-4 text-violet-400" />}
        label="Nash Equilibrium Decision"
        isComplete={!!finalRecommendation}
      >
        <div className="grid grid-cols-2 gap-4 text-[#94A3B8]">
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Final Decision</span>
            <span className="font-mono text-violet-400 font-medium uppercase">
              {finalRecommendation?.action.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-1">Confidence Score</span>
            <span className="font-mono text-violet-400">
              {((finalRecommendation?.confidence || 0) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-[#64748B] text-xs block mb-1">Synthesis</span>
            <p className="text-[#94A3B8] text-sm italic leading-relaxed">
              {finalRecommendation?.explanation}
            </p>
          </div>
        </div>
      </AgentSection>
    </div>
  );
}
