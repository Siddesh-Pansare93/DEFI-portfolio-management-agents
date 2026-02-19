"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn, formatUSD, formatPercent } from "@/lib/utils";
import { WorkflowState } from "@/lib/types";
import { AgentName } from "@/lib/constants";
import { NeonBadge } from "@/components/shared/NeonBadge";

interface AgentOutputPanelProps {
  agentName: AgentName;
  data: WorkflowState | null;
  isOpen?: boolean;
}

export function AgentOutputPanel({ agentName, data, isOpen: initialOpen = false }: AgentOutputPanelProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  if (!data) return null;

  const renderContent = () => {
    switch (agentName) {
      case 'Data Collector':
        if (!data.portfolio) return <span className="text-zinc-500">No data collected...</span>;
        return (
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <span className="text-zinc-400">Total Value:</span>
              <div className="text-neon-cyan font-bold">{formatUSD(data.portfolio.totalValueUSD)}</div>
            </div>
            <div>
              <span className="text-zinc-400">ETH Balance:</span>
              <div className="text-white">{data.portfolio.holdings.ETH.balance.toFixed(4)} ETH</div>
            </div>
            <div>
              <span className="text-zinc-400">Pool Liquidity:</span>
              <div className="text-white">{formatUSD(data.portfolio.uniswapPool.liquidity)}</div>
            </div>
          </div>
        );

      case 'Market Analyzer':
        if (!data.marketAnalysis) return <span className="text-zinc-500">Analyzing market...</span>;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Trend:</span>
              <NeonBadge 
                label={data.marketAnalysis.ethTrend.toUpperCase()} 
                color={data.marketAnalysis.ethTrend === 'bullish' ? 'green' : 'red'} 
                size="sm" 
              />
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Volatility:</span>
              <span className="text-neon-blue font-mono">{formatPercent(data.marketAnalysis.volatility)}</span>
            </div>
            <p className="text-zinc-300 text-xs italic border-l-2 border-white/10 pl-2 mt-2">
              "{data.marketAnalysis.reasoning}"
            </p>
          </div>
        );

      case 'Strategy Proposer':
        if (!data.strategyProposal) return <span className="text-zinc-500">Formulating strategy...</span>;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Action:</span>
              <span className="text-neon-yellow font-bold uppercase">{data.strategyProposal.action.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Est. APY:</span>
              <span className="text-neon-green font-mono">{formatPercent(data.strategyProposal.expectedAPY)}</span>
            </div>
            <p className="text-zinc-300 text-xs italic border-l-2 border-white/10 pl-2 mt-2">
              "{data.strategyProposal.reasoning}"
            </p>
          </div>
        );

      case 'Risk Validator':
        if (!data.riskValidation) return <span className="text-zinc-500">Validating risk...</span>;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Status:</span>
              <NeonBadge 
                label={data.riskValidation.approved ? "APPROVED" : "REJECTED"} 
                color={data.riskValidation.approved ? "green" : "red"} 
                size="sm" 
              />
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Risk Score:</span>
              <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden relative top-1">
                <div 
                  className={cn("h-full", data.riskValidation.riskScore > 0.7 ? "bg-red-500" : "bg-neon-orange")} 
                  style={{ width: `${data.riskValidation.riskScore * 100}%` }}
                />
              </div>
            </div>
            {data.riskValidation.violations.length > 0 && (
              <div className="text-red-400 text-xs mt-1">
                Violations: {data.riskValidation.violations.join(", ")}
              </div>
            )}
          </div>
        );

      case 'Nash Negotiator':
        if (!data.finalRecommendation) return <span className="text-zinc-500">Finalizing...</span>;
        return (
          <div className="space-y-2 text-sm">
             <div className="flex justify-between items-center">
              <span className="text-zinc-400">Decision:</span>
              <NeonBadge 
                label={data.finalRecommendation.action.toUpperCase().replace('_', ' ')} 
                color="purple" 
                size="md" 
              />
            </div>
             <div className="flex justify-between">
              <span className="text-zinc-400">Confidence:</span>
              <span className="text-neon-purple font-mono">{formatPercent(data.finalRecommendation.confidence * 100)}</span>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 w-full max-w-xs">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-2"
      >
        <span>Output Data</span>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      
      <motion.div 
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden bg-black/40 border border-white/5 rounded-md backdrop-blur-sm"
      >
        <div className="p-3">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}
