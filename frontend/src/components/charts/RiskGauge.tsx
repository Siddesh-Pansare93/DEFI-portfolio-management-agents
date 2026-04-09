"use client";

interface RiskGaugeProps {
  score: number; // 0-1
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const percentage = Math.round(score * 100);
  const clampedScore = Math.max(0, Math.min(1, score));

  // Semicircle SVG gauge
  const radius = 70;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 90;

  // Arc from 180 degrees (left) to 0 degrees (right)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = startAngle - (startAngle - endAngle) * clampedScore;

  const arcStartX = cx + radius * Math.cos(startAngle);
  const arcStartY = cy - radius * Math.sin(startAngle);
  const arcEndX = cx + radius * Math.cos(sweepAngle);
  const arcEndY = cy - radius * Math.sin(sweepAngle);

  const bgArcEndX = cx + radius * Math.cos(endAngle);
  const bgArcEndY = cy - radius * Math.sin(endAngle);

  const largeArcFlag = clampedScore > 0.5 ? 1 : 0;

  const bgPath = `M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 1 1 ${bgArcEndX} ${bgArcEndY}`;
  const fillPath =
    clampedScore > 0
      ? `M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${arcEndX} ${arcEndY}`
      : "";

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-4">
        Risk Level
      </h3>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={bgPath}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center text */}
        <div className="-mt-14 text-center">
          <div className="font-mono text-2xl font-bold text-white">
            {percentage}%
          </div>
          <div className="text-xs text-[#64748B] mt-1">Risk Score</div>
        </div>
      </div>
    </div>
  );
}
