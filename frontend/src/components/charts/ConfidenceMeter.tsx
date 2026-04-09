"use client";

interface ConfidenceMeterProps {
  confidence: number; // 0-1
}

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100);
  const clampedHeight = Math.max(0, Math.min(100, percentage));

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-4">
        Confidence
      </h3>

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
  );
}
