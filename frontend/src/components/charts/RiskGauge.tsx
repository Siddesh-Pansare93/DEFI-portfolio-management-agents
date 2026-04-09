"use client";

interface RiskGaugeProps {
  score: number; // 0-1
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const percentage = Math.round(Math.max(0, Math.min(1, score)) * 100);
  const clamped = Math.max(0.01, Math.min(0.99, score));

  // Semicircle parameters
  const size = 200;
  const cx = size / 2;
  const cy = 105;
  const r = 75;
  const stroke = 14;

  // Helper: angle to point on arc (0 = left, PI = right for a top semicircle)
  // We go from 180deg (left) to 0deg (right) — that's a standard top semicircle
  const pointOnArc = (fraction: number) => {
    const angle = Math.PI * (1 - fraction); // 0->PI=left, 1->0=right
    return {
      x: cx + r * Math.cos(angle),
      y: cy - r * Math.sin(angle),
    };
  };

  const start = pointOnArc(0);
  const end = pointOnArc(1);
  const fill = pointOnArc(clamped);

  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  // Fix: for a semicircle, the large-arc-flag should always be 0
  const fillPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${fill.x} ${fill.y}`;

  // Needle indicator dot position
  const needle = pointOnArc(clamped);

  // Color based on score
  const scoreColor =
    percentage <= 30 ? "#22C55E" : percentage <= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="glass-card p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#4A4F5A] mb-4">
        Risk Score
      </h3>

      <div className="flex flex-col items-center justify-center h-[200px] relative">
        <svg viewBox="0 0 200 120" className="w-full max-w-[220px]">
          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            
            <filter id="needleGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          <path
            d={fillPath}
            fill="none"
            stroke="url(#riskGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Needle dot */}
          <circle
            cx={needle.x}
            cy={needle.y}
            r={5}
            fill={scoreColor}
            filter="url(#needleGlow)"
          />
          <circle cx={needle.x} cy={needle.y} r={2.5} fill="white" />
        </svg>

        {/* Center value */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-2 text-center pointer-events-none">
          <div className="font-mono text-3xl font-bold" style={{ color: scoreColor }}>
            {percentage}%
          </div>
        </div>
      </div>
    </div>
  );
}