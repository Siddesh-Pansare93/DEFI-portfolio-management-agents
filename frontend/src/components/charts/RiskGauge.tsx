"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { GlowContainer } from "@/components/layout/GlowContainer";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  score: number; // 0-1
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const percentage = score * 100;
  
  // Determine color based on risk level
  const getColor = () => {
    if (score < 0.3) return "#00ff88"; // Green (Safe)
    if (score < 0.7) return "#ff6600"; // Orange (Medium)
    return "#ff0000"; // Red (High Risk)
  };

  const chartData = [
    { name: "Risk", value: percentage, fill: getColor() },
  ];

  return (
    <GlowContainer glowColor="orange" intensity="medium" className="flex flex-col items-center p-6 h-full">
      <h3 className="font-orbitron text-lg text-white mb-4 tracking-wider">Risk Level</h3>
      
      <div className="w-full h-[200px] relative flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={10}
            data={chartData}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
              fill={getColor()}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Needle/Text */}
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-4xl font-bold font-mono text-white tracking-tighter">
            {percentage.toFixed(0)}%
          </div>
          <div className={cn("text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded", 
            score < 0.3 ? "text-neon-green bg-neon-green/10" :
            score < 0.7 ? "text-neon-orange bg-neon-orange/10" : "text-red-500 bg-red-500/10"
          )}>
            {score < 0.3 ? "Low Risk" : score < 0.7 ? "Moderate" : "High Risk"}
          </div>
        </div>
      </div>
      
      <p className="text-zinc-400 text-xs text-center mt-2 px-4">
        Probability of impermanent loss exceeding 5% based on current volatility.
      </p>
    </GlowContainer>
  );
}
