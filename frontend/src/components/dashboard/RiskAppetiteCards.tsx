"use client";

import { Shield, Scale, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserPreferences } from "@/lib/types";

interface RiskAppetiteCardsProps {
  value: UserPreferences["riskAppetite"];
  onChange: (value: UserPreferences["riskAppetite"]) => void;
}

export function RiskAppetiteCards({ value, onChange }: RiskAppetiteCardsProps) {
  const options = [
    {
      value: "conservative",
      label: "Conservative",
      icon: Shield,
      desc: "Low risk, stable returns",
      color: "cyan",
    },
    {
      value: "moderate",
      label: "Moderate",
      icon: Scale,
      desc: "Balanced risk/reward",
      color: "blue",
    },
    {
      value: "aggressive",
      label: "Aggressive",
      icon: Zap,
      desc: "High risk, max yield",
      color: "purple",
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-4">
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 group",
              isSelected
                ? `bg-${option.color}-500/10 border-${option.color}-500/50 shadow-[0_0_15px_rgba(var(--${option.color}-rgb),0.3)]`
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <div
              className={cn(
                "p-3 rounded-full mb-3 transition-colors",
                isSelected
                  ? `bg-${option.color}-500/20 text-${option.color}-400`
                  : "bg-white/5 text-zinc-400 group-hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "text-sm font-bold font-orbitron mb-1",
                isSelected ? "text-white" : "text-zinc-400"
              )}
            >
              {option.label}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono text-center leading-tight">
              {option.desc}
            </span>

            {isSelected && (
              <div
                className={cn(
                  "absolute inset-0 rounded-xl border-2 pointer-events-none animate-pulse",
                  `border-${option.color}-500/30`
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
