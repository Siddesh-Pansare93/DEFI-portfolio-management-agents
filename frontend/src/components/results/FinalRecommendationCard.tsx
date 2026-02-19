"use client";

import { motion } from "framer-motion";
import { GlowContainer } from "@/components/layout/GlowContainer";
import { NeonBadge } from "@/components/shared/NeonBadge";
import { Button } from "@/components/ui/button";
import { formatAPY, formatUSD, cn } from "@/lib/utils";
import { FinalRecommendation, StrategyProposal } from "@/lib/types";
import { Zap, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";

interface FinalRecommendationCardProps {
  recommendation: FinalRecommendation;
  onExecute?: () => void;
  isExecuting?: boolean;
}

export function FinalRecommendationCard({ recommendation, onExecute, isExecuting = false }: FinalRecommendationCardProps) {
  const { action, expectedAPY, maxRisk, confidence, explanation } = recommendation;

  const actionColorMap = {
    add_liquidity: "cyan",
    swap: "yellow",
    hold: "purple",
  };

  const actionTextMap = {
    add_liquidity: "PROVIDE LIQUIDITY",
    swap: "EXECUTE SWAP",
    hold: "MAINTAIN POSITION",
  };

  const color = actionColorMap[action];
  const glowIntensity = action === "hold" ? "low" : "high";

  return (
    <GlowContainer glowColor={color as any} intensity={glowIntensity} className="w-full max-w-4xl mx-auto p-8 relative overflow-hidden group">
      
      {/* Background Pulse Effect */}
      <motion.div 
        className={cn("absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none")} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
        
        {/* Left Side: Main Action */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Zap className={cn("w-6 h-6", `text-neon-${color}`)} />
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold tracking-tight text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {actionTextMap[action]}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <NeonBadge label={`APY: ${formatAPY(expectedAPY)}`} color="green" size="lg" />
            <NeonBadge label={`RISK: ${(maxRisk * 100).toFixed(1)}%`} color={maxRisk > 0.05 ? "orange" : "green"} size="md" />
            <NeonBadge label={`CONFIDENCE: ${(confidence * 100).toFixed(0)}%`} color="purple" size="md" />
          </div>

          <p className="text-zinc-400 font-mono text-sm max-w-xl leading-relaxed border-l-2 border-white/10 pl-4 mt-4">
            "{explanation}"
          </p>
        </div>

        {/* Right Side: CTA Button */}
        <div className="flex flex-col items-end gap-4 min-w-[200px]">
          {action !== "hold" && (
            <Button 
              size="lg" 
              className={cn(
                "w-full font-orbitron tracking-wider text-lg h-14 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-300",
                color === "cyan" ? "bg-neon-cyan text-black hover:bg-neon-cyan/90 shadow-[0_0_15px_#00ffff]" :
                color === "yellow" ? "bg-neon-yellow text-black hover:bg-neon-yellow/90 shadow-[0_0_15px_#ffee00]" :
                "bg-neon-purple text-white hover:bg-neon-purple/90 shadow-[0_0_15px_#aa00ff]"
              )}
              onClick={onExecute}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  EXECUTING...
                </>
              ) : (
                "EXECUTE ON-CHAIN"
              )}
            </Button>
          )}
          
          {action === "hold" && (
            <div className="flex items-center gap-2 text-neon-purple font-mono animate-pulse">
              <CheckCircle className="w-5 h-5" />
              <span>OPTIMAL STATE VERIFIED</span>
            </div>
          )}

          <div className="text-xs text-zinc-500 font-mono text-right mt-2 flex items-center justify-end gap-1">
            <Info className="w-3 h-3" />
            <span>Gas Estimate: ~0.004 ETH</span>
          </div>
        </div>

      </div>
    </GlowContainer>
  );
}
