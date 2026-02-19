"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GlowContainer } from "@/components/layout/GlowContainer";
import { WorkflowState } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/utils";
import { Database, TrendingUp, Lightbulb, Shield, Scale } from "lucide-react";

interface WorkflowSummaryProps {
  state: WorkflowState | null;
}

export function WorkflowSummary({ state }: WorkflowSummaryProps) {
  if (!state) return null;

  const { portfolio, marketAnalysis, strategyProposal, riskValidation, finalRecommendation } = state;

  return (
    <GlowContainer glowColor="purple" intensity="low" className="w-full max-w-4xl mx-auto mt-12 mb-20 bg-black/40 border-white/5">
      <h3 className="text-xl font-orbitron text-zinc-400 mb-6 px-4">Full Agent Execution Trace</h3>
      
      <Accordion type="single" collapsible className="w-full">
        
        {/* Data Collector */}
        <AccordionItem value="data-collector" className="border-white/10">
          <AccordionTrigger className="hover:text-neon-cyan px-4 group">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-neon-cyan group-hover:animate-pulse" />
              <span className="font-mono text-sm tracking-widest uppercase">Data Collector Output</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-black/20 px-4 py-4 text-zinc-300 font-mono text-xs space-y-2 border-t border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 block mb-1">Portfolio Value:</span>
                <span className="text-white">{formatUSD(portfolio?.totalValueUSD || 0)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">ETH Balance:</span>
                <span className="text-white">{portfolio?.holdings.ETH.balance.toFixed(4)} ETH</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">USDC Balance:</span>
                <span className="text-white">{formatUSD(portfolio?.holdings.USDC.balance || 0)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Uniswap Pool Liquidity:</span>
                <span className="text-white">{formatUSD(portfolio?.uniswapPool.liquidity || 0)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Market Analyzer */}
        <AccordionItem value="market-analyzer" className="border-white/10">
          <AccordionTrigger className="hover:text-neon-blue px-4 group">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-neon-blue group-hover:animate-pulse" />
              <span className="font-mono text-sm tracking-widest uppercase">Market Analysis Report</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-black/20 px-4 py-4 text-zinc-300 font-mono text-xs space-y-2 border-t border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 block mb-1">Trend:</span>
                <span className={marketAnalysis?.ethTrend === 'bullish' ? "text-neon-green" : "text-neon-blue"}>
                  {marketAnalysis?.ethTrend.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Volatility (30d):</span>
                <span className="text-white">{formatPercent(marketAnalysis?.volatility || 0)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-500 block mb-1">Reasoning:</span>
                <p className="italic text-zinc-400">"{marketAnalysis?.reasoning}"</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Strategy Proposer */}
        <AccordionItem value="strategy-proposer" className="border-white/10">
          <AccordionTrigger className="hover:text-neon-yellow px-4 group">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-4 h-4 text-neon-yellow group-hover:animate-pulse" />
              <span className="font-mono text-sm tracking-widest uppercase">Strategy Proposal</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-black/20 px-4 py-4 text-zinc-300 font-mono text-xs space-y-2 border-t border-white/5">
             <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 block mb-1">Proposed Action:</span>
                <span className="text-neon-yellow font-bold">{strategyProposal?.action.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Est. APY:</span>
                <span className="text-neon-green">{formatPercent(strategyProposal?.expectedAPY || 0)}</span>
              </div>
               <div className="col-span-2">
                <span className="text-zinc-500 block mb-1">Logic:</span>
                <p className="italic text-zinc-400">"{strategyProposal?.reasoning}"</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Risk Validator */}
        <AccordionItem value="risk-validator" className="border-white/10">
          <AccordionTrigger className="hover:text-neon-orange px-4 group">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-neon-orange group-hover:animate-pulse" />
              <span className="font-mono text-sm tracking-widest uppercase">Risk Assessment</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-black/20 px-4 py-4 text-zinc-300 font-mono text-xs space-y-2 border-t border-white/5">
             <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 block mb-1">Status:</span>
                <span className={riskValidation?.approved ? "text-neon-green" : "text-red-500"}>
                  {riskValidation?.approved ? "APPROVED" : "REJECTED"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Risk Score:</span>
                <span className={riskValidation?.riskScore || 0 > 0.5 ? "text-red-500" : "text-neon-green"}>
                  {(riskValidation?.riskScore || 0 * 100).toFixed(1)}/100
                </span>
              </div>
               <div className="col-span-2">
                <span className="text-zinc-500 block mb-1">Analysis:</span>
                <p className="italic text-zinc-400">"{riskValidation?.reasoning}"</p>
                {riskValidation?.violations && riskValidation.violations.length > 0 && (
                  <div className="mt-2 text-red-400">
                    Violations: {riskValidation.violations.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Nash Negotiator */}
        <AccordionItem value="nash-negotiator" className="border-white/10">
          <AccordionTrigger className="hover:text-neon-purple px-4 group">
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-neon-purple group-hover:animate-pulse" />
              <span className="font-mono text-sm tracking-widest uppercase">Nash Equilibrium Decision</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-black/20 px-4 py-4 text-zinc-300 font-mono text-xs space-y-2 border-t border-white/5">
             <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 block mb-1">Final Decision:</span>
                <span className="text-neon-purple font-bold">{finalRecommendation?.action.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Confidence Score:</span>
                <span className="text-neon-purple">{(finalRecommendation?.confidence || 0 * 100).toFixed(1)}%</span>
              </div>
               <div className="col-span-2">
                <span className="text-zinc-500 block mb-1">Synthesis:</span>
                <p className="italic text-zinc-400">"{finalRecommendation?.explanation}"</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </GlowContainer>
  );
}
