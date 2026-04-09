"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeuralCardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string; // hex color for the halo
  halo?: boolean; // enable moving halo effect
  glow?: boolean; // enable border glow
}

/**
 * Premium glass card with optional animated halo border effect.
 * Inspired by 21st.dev StatCard — moving light orb traces the border.
 */
export function NeuralCard({
  children,
  className,
  accentColor = "#8B5CF6",
  halo = false,
  glow = false,
}: NeuralCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden p-[1px]",
        className
      )}
    >
      {/* Gradient border background */}
      <div
        className="absolute inset-0 rounded-2xl opacity-40"
        style={{
          background: `linear-gradient(135deg, ${accentColor}25, transparent 40%, transparent 60%, ${accentColor}15)`,
        }}
      />

      {/* Moving halo orb */}
      {halo && (
        <motion.div
          className="absolute w-16 h-16 rounded-full pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle, ${accentColor}40, transparent 70%)`,
            filter: "blur(12px)",
          }}
          animate={{
            top: ["8%", "8%", "80%", "80%", "8%"],
            left: ["8%", "85%", "85%", "8%", "8%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Inner card */}
      <div
        className={cn(
          "relative w-full h-full rounded-2xl border border-white/[0.06] backdrop-blur-xl",
          "bg-gradient-to-br from-[#0A0A0F]/90 via-[#0A0A0F]/95 to-[#0F0F18]/90",
          glow && "shadow-[0_0_30px_rgba(139,92,246,0.08)]"
        )}
        style={{
          boxShadow: glow
            ? `0 0 30px ${accentColor}12, inset 0 1px 0 rgba(255,255,255,0.04)`
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Section label for inside NeuralCard
 */
export function CardLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-medium uppercase tracking-[0.12em] text-white/30", className)}>
      {children}
    </span>
  );
}

/**
 * Big mono value display
 */
export function CardValue({ children, className, color }: { children: React.ReactNode; className?: string; color?: string }) {
  return (
    <span
      className={cn("font-mono text-2xl font-bold", className)}
      style={{ color: color || "#EDEDEF" }}
    >
      {children}
    </span>
  );
}
