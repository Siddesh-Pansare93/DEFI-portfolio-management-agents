"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { UserPreferences } from "@/lib/types";

interface PreferredActionsSelectorProps {
  value: UserPreferences["preferredActions"];
  onChange: (value: UserPreferences["preferredActions"]) => void;
}

export function PreferredActionsSelector({
  value,
  onChange,
}: PreferredActionsSelectorProps) {
  const actions = [
    {
      id: "add_liquidity",
      label: "Add Liquidity",
      desc: "Provide tokens to Uniswap V3 pools for fees",
    },
    {
      id: "swap",
      label: "Token Swaps",
      desc: "Trade tokens to rebalance portfolio",
    },
    {
      id: "hold",
      label: "Hold Strategy",
      desc: "Maintain current positions if optimal",
    },
  ] as const;

  const toggleAction = (actionId: string) => {
    const isSelected = value.includes(actionId as any);
    if (isSelected) {
      // Don't allow deselecting the last action
      if (value.length <= 1) return;
      onChange(value.filter((a) => a !== actionId));
    } else {
      onChange([...value, actionId as any]);
    }
  };

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const isSelected = value.includes(action.id as any);
        return (
          <div
            key={action.id}
            onClick={() => toggleAction(action.id)}
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer group ${
              isSelected
                ? "bg-neon-cyan/5 border-neon-cyan/20 hover:bg-neon-cyan/10"
                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
            }`}
          >
            <Checkbox
              checked={isSelected}
              className={`mt-1 border-white/20 data-[state=checked]:bg-neon-cyan data-[state=checked]:border-neon-cyan data-[state=checked]:text-black`}
            />
            <div className="flex-1 space-y-0.5">
              <label
                className={`text-sm font-medium font-orbitron cursor-pointer ${
                  isSelected ? "text-white" : "text-zinc-400"
                }`}
              >
                {action.label}
              </label>
              <p className="text-xs text-zinc-500 font-mono leading-tight">
                {action.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
