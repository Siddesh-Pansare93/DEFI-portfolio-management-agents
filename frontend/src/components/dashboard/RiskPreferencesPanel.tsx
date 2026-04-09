"use client";

import { useEffect, useState } from "react";
import { UserPreferences } from "@/lib/types";
import { RiskAppetiteCards } from "./RiskAppetiteCards";
import { SliderWithPreview } from "./SliderWithPreview";
import { PreferredActionsSelector } from "./PreferredActionsSelector";
import { Info } from "lucide-react";

interface RiskPreferencesPanelProps {
  preferences: UserPreferences;
  onChange: (prefs: Partial<UserPreferences>) => void;
}

export function RiskPreferencesPanel({
  preferences,
  onChange,
}: RiskPreferencesPanelProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");

  // Handle Preset Selection
  const handlePresetChange = (riskAppetite: UserPreferences["riskAppetite"]) => {
    let newPrefs: Partial<UserPreferences> = { riskAppetite };

    if (riskAppetite === "conservative") {
      newPrefs = {
        ...newPrefs,
        maxImpermanentLoss: 7,
        maxPositionSize: 50,
        preferredActions: ["hold", "add_liquidity"],
      };
    } else if (riskAppetite === "moderate") {
      newPrefs = {
        ...newPrefs,
        maxImpermanentLoss: 10,
        maxPositionSize: 70,
        preferredActions: ["add_liquidity", "swap", "hold"],
      };
    } else {
      // Aggressive
      newPrefs = {
        ...newPrefs,
        maxImpermanentLoss: 15,
        maxPositionSize: 90,
        preferredActions: ["swap", "add_liquidity"],
      };
    }

    onChange(newPrefs);
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
            <Info className="w-4 h-4 text-neon-orange" />
          </div>
          <h2 className="text-lg font-bold font-orbitron text-white">
            Risk Parameters
          </h2>
        </div>
        <div className="flex bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("presets")}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === "presets"
                ? "bg-neon-cyan/20 text-neon-cyan font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === "custom"
                ? "bg-neon-cyan/20 text-neon-cyan font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {activeTab === "presets" ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <RiskAppetiteCards
            value={preferences.riskAppetite}
            onChange={handlePresetChange}
          />
          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
            <div className="flex justify-between text-sm text-zinc-400 font-mono">
              <span>Max IL Tolerance:</span>
              <span className="text-white font-bold">
                {preferences.maxImpermanentLoss}%
              </span>
            </div>
            <div className="flex justify-between text-sm text-zinc-400 font-mono">
              <span>Max Position Size:</span>
              <span className="text-white font-bold">
                {preferences.maxPositionSize}%
              </span>
            </div>
            <div className="flex justify-between text-sm text-zinc-400 font-mono">
              <span>Preferred Actions:</span>
              <span className="text-white font-bold text-right max-w-[150px] truncate">
                {preferences.preferredActions.join(", ")}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-mono text-center">
            Switch to 'Custom' tab to fine-tune these values.
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
          <SliderWithPreview
            label="Max Impermanent Loss"
            value={preferences.maxImpermanentLoss}
            min={1}
            max={20}
            step={1}
            unit="%"
            onChange={(val) => onChange({ maxImpermanentLoss: val })}
            description="Maximum percentage loss due to price divergence in liquidity pools."
            previewText={`At ${preferences.maxImpermanentLoss}%, if ETH drops 25%, your IL is capped at ~$${(
              1000 *
              (preferences.maxImpermanentLoss / 100)
            ).toFixed(0)} per $1k.`}
            isRiskFactor={true}
          />

          <SliderWithPreview
            label="Max Position Size"
            value={preferences.maxPositionSize}
            min={10}
            max={90}
            step={5}
            unit="%"
            onChange={(val) => onChange({ maxPositionSize: val })}
            description="Percentage of portfolio allocated to a single strategy."
            previewText={`Invests up to ${preferences.maxPositionSize}% of available capital in one go.`}
            isRiskFactor={true}
          />

          <div className="space-y-2">
            <label className="text-sm font-mono text-zinc-300 font-medium block">
              Allowed Actions
            </label>
            <PreferredActionsSelector
              value={preferences.preferredActions}
              onChange={(val) => onChange({ preferredActions: val })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
