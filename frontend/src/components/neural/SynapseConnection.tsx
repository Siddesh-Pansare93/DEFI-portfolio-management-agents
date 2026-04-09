import React from 'react';

export interface SynapseConnectionProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  status: 'idle' | 'flowing' | 'complete';
  colorHex?: string;
  className?: string;
}

export function SynapseConnection({
  startX,
  startY,
  endX,
  endY,
  status,
  colorHex = '#ffffff',
}: SynapseConnectionProps) {
  const isFlowing = status === 'flowing';
  const isComplete = status === 'complete';

  const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;

  // Return raw SVG elements (no wrapper <svg> — parent already provides one)
  return (
    <g>
      {/* Base dashed line (always visible) */}
      <path
        d={pathData}
        stroke="rgba(255, 255, 255, 0.06)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        fill="none"
      />

      {/* Glowing line when flowing or complete */}
      {(isFlowing || isComplete) && (
        <path
          d={pathData}
          stroke={colorHex}
          strokeWidth="2"
          strokeOpacity={isComplete ? 0.15 : 0.3}
          fill="none"
        />
      )}

      {/* Traveling particle when flowing */}
      {isFlowing && (
        <circle r="4" fill={colorHex} filter={`url(#glow-${colorHex.replace('#','')})`}>
          <animateMotion
            dur="1s"
            repeatCount="indefinite"
            path={pathData}
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}