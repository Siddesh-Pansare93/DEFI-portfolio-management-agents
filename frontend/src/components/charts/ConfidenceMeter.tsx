"use client";

import { motion } from "framer-motion";
import { GlowContainer } from "@/components/layout/GlowContainer";
import { cn, formatPercent } from "@/lib/utils";

interface ConfidenceMeterProps {
  confidence: number; // 0-1
}

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const percentage = confidence * 100;
  
  return (
    <GlowContainer glowColor="purple" intensity="low" className="flex flex-col items-center p-6 h-full">
      <h3 className="font-orbitron text-lg text-white mb-4 tracking-wider">AI Confidence</h3>
      
      <div className="w-16 h-40 bg-white/10 rounded-full relative overflow-hidden flex items-end">
        <motion.div
          className={cn("w-full bg-gradient-to-t from-neon-purple to-neon-blue rounded-b-full transition-all duration-1000",
            confidence > 0.8 ? "shadow-[0_0_20px_#aa00ff]" : ""
          )}
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
        />
        
        {/* Animated bubbles */}
        <motion.div 
          className="absolute inset-0 bg-[url('/scanlines.png')] opacity-20 pointer-events-none mix-blend-overlay" 
          animate={{ backgroundPosition: ["0% 0%", "0% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold font-mono text-neon-purple">{formatPercent(confidence)}</div>
        <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">Probability</div>
      </div>
    </GlowContainer>
  );
}
