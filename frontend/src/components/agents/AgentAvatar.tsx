"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  status: "idle" | "active" | "complete" | "error";
  icon: React.ElementType;
  color: "cyan" | "blue" | "yellow" | "orange" | "purple";
  className?: string;
}

export function AgentAvatar({ status, icon: Icon, color, className }: AgentAvatarProps) {
  const colorMap = {
    cyan: "text-neon-cyan border-neon-cyan bg-neon-cyan/20",
    blue: "text-neon-blue border-neon-blue bg-neon-blue/20",
    yellow: "text-neon-yellow border-neon-yellow bg-neon-yellow/20",
    orange: "text-neon-orange border-neon-orange bg-neon-orange/20",
    purple: "text-neon-purple border-neon-purple bg-neon-purple/20",
  };

  const glowMap = {
    cyan: "shadow-[0_0_20px_rgba(0,255,255,0.4)]",
    blue: "shadow-[0_0_20px_rgba(68,136,255,0.4)]",
    yellow: "shadow-[0_0_20px_rgba(255,238,0,0.4)]",
    orange: "shadow-[0_0_20px_rgba(255,102,0,0.4)]",
    purple: "shadow-[0_0_20px_rgba(170,0,255,0.4)]",
  };

  return (
    <div className={cn("relative flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-500", 
      status === "idle" ? "border-white/10 text-white/20 bg-black/50 grayscale" : colorMap[color],
      status === "active" ? `animate-pulse ${glowMap[color]}` : "",
      status === "complete" ? glowMap[color] : "",
      className
    )}>
      {/* Background spin effect for active state */}
      {status === "active" && (
        <motion.div
          className={cn("absolute inset-0 rounded-full border-2 border-t-transparent border-l-transparent", 
            color === "cyan" ? "border-neon-cyan" : `border-neon-${color}`
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Icon Swap */}
      <div className="relative z-10">
        {status === "complete" ? (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <Check className="w-8 h-8 stroke-[3]" />
          </motion.div>
        ) : (
          <Icon className={cn("w-8 h-8 transition-opacity duration-300", status === "idle" ? "opacity-40" : "opacity-100")} />
        )}
      </div>

      {/* Ripple effect on complete */}
      {status === "complete" && (
        <motion.div
          className={cn("absolute inset-0 rounded-full border-2 opacity-0", colorMap[color])}
          animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}
    </div>
  );
}
