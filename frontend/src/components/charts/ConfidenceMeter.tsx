"use client";

import { NeuralCard, CardLabel } from "@/components/ui/neural-card";

interface ConfidenceMeterProps {
  confidence: number; // 0-1
}

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100);
  const clampedHeight = Math.max(0, Math.min(100, percentage));

  return (
    <NeuralCard accentColor="#6366F1" halo>
      <div className="p-5">
      <CardLabel className="mb-4 block">Confidence</CardLabel>

      <div className="flex flex-col items-center">
        {/* Percentage text */}
        <div className="font-mono text-2xl font-bold text-white mb-3">
          {percentage}%
        </div>

        {/* Vertical progress bar */}
        <div className="w-14 h-40 bg-[#1A1F2E] rounded-lg relative overflow-hidden border border-[#334155]">
          <div
            className="absolute bottom-0 left-0 right-0 rounded-b-lg transition-all duration-700 ease-out"
            style={{
              height: `${clampedHeight}%`,
              background: "linear-gradient(to top, #8B5CF6, #F59E0B)",
            }}
          />
        </div>

        {/* Label */}
        <div className="text-xs text-[#64748B] mt-3">Confidence</div>
      </div>
      </div>
    </NeuralCard>
  );
}
