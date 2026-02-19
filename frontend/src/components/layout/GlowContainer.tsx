import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowContainerProps {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "blue" | "yellow" | "orange" | "purple" | "green";
  intensity?: "low" | "medium" | "high";
}

export function GlowContainer({ 
  children, 
  className, 
  glowColor,
  intensity = "medium" 
}: GlowContainerProps) {
  
  const glowMap = {
    cyan: "shadow-[0_0_15px_rgba(0,255,255,0.3)] border-neon-cyan/50",
    blue: "shadow-[0_0_15px_rgba(68,136,255,0.3)] border-neon-blue/50",
    yellow: "shadow-[0_0_15px_rgba(255,238,0,0.3)] border-neon-yellow/50",
    orange: "shadow-[0_0_15px_rgba(255,102,0,0.3)] border-neon-orange/50",
    purple: "shadow-[0_0_15px_rgba(170,0,255,0.3)] border-neon-purple/50",
    green: "shadow-[0_0_15px_rgba(0,255,136,0.3)] border-neon-green/50",
  };

  const intensityMap = {
    low: "shadow-sm",
    medium: "shadow-md",
    high: "shadow-lg animate-pulse", // subtle pulse for high intensity
  };

  const borderColor = glowColor ? (glowColor === 'cyan' ? 'border-neon-cyan' : `border-neon-${glowColor}`) : 'border-white/10';

  return (
    <div 
      className={cn(
        "relative rounded-xl border bg-bg-panel/80 backdrop-blur-sm p-6 transition-all duration-300 overflow-hidden",
        glowColor ? glowMap[glowColor] : "border-white/10 shadow-none",
        intensityMap[intensity],
        className
      )}
    >
      {children}
      {/* Corner accents */}
      {glowColor && (
        <>
          <div className={`absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 rounded-tl-lg ${borderColor}`} />
          <div className={`absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 rounded-br-lg ${borderColor}`} />
        </>
      )}
    </div>
  );
}
