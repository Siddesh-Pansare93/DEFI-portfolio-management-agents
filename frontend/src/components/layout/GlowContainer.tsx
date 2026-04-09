import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowContainerProps {
  children: ReactNode;
  className?: string;
  /** @deprecated Kept for backwards compatibility; no longer affects styling. */
  glowColor?: "cyan" | "blue" | "yellow" | "orange" | "purple" | "green";
  /** @deprecated Kept for backwards compatibility; no longer affects styling. */
  intensity?: "low" | "medium" | "high";
}

export function GlowContainer({
  children,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  glowColor: _glowColor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  intensity: _intensity,
}: GlowContainerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#334155] bg-[#222735] shadow-lg shadow-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[#3F3F46] transition-colors duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
