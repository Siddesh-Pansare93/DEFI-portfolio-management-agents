import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NeonBadgeProps {
  label: string;
  color?: "cyan" | "blue" | "yellow" | "orange" | "purple" | "green" | "red";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function NeonBadge({ label, color = "cyan", className, size = "md" }: NeonBadgeProps) {
  
  const colorStyles = {
    cyan: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 hover:bg-neon-cyan/30 shadow-[0_0_8px_rgba(0,255,255,0.4)]",
    blue: "bg-neon-blue/20 text-neon-blue border-neon-blue/50 hover:bg-neon-blue/30 shadow-[0_0_8px_rgba(68,136,255,0.4)]",
    yellow: "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/50 hover:bg-neon-yellow/30 shadow-[0_0_8px_rgba(255,238,0,0.4)]",
    orange: "bg-neon-orange/20 text-neon-orange border-neon-orange/50 hover:bg-neon-orange/30 shadow-[0_0_8px_rgba(255,102,0,0.4)]",
    purple: "bg-neon-purple/20 text-neon-purple border-neon-purple/50 hover:bg-neon-purple/30 shadow-[0_0_8px_rgba(170,0,255,0.4)]",
    green: "bg-neon-green/20 text-neon-green border-neon-green/50 hover:bg-neon-green/30 shadow-[0_0_8px_rgba(0,255,136,0.4)]",
    red: "bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.4)]", // Fallback for error/high risk
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base font-medium",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "transition-all duration-300 backdrop-blur-sm font-mono tracking-wider",
        colorStyles[color],
        sizeStyles[size],
        className
      )}
    >
      {label}
    </Badge>
  );
}
