"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PortfolioData } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/utils";
import { GlowContainer } from "@/components/layout/GlowContainer";

interface PortfolioDonutProps {
  data: PortfolioData | null;
}

export function PortfolioDonut({ data }: PortfolioDonutProps) {
  if (!data) return null;

  const chartData = [
    { name: "ETH", value: data.holdings.ETH.valueUSD, color: "#00ffff" },
    { name: "USDC", value: data.holdings.USDC.valueUSD, color: "#ff00ff" },
  ];

  return (
    <GlowContainer glowColor="cyan" intensity="low" className="flex flex-col items-center p-6 h-full">
      <h3 className="font-orbitron text-lg text-white mb-4 tracking-wider">Current Portfolio</h3>
      
      <div className="w-full h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "8px" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number) => formatUSD(value)}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-xs text-zinc-500 font-mono">TOTAL</div>
          <div className="text-sm font-bold text-white font-mono">{formatUSD(data.totalValueUSD)}</div>
        </div>
      </div>

      <div className="flex w-full justify-between mt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-cyan" />
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-mono">ETH</span>
            <span className="text-sm font-bold text-white">{formatPercent(data.allocationPercent.ETH)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff00ff]" />
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-mono">USDC</span>
            <span className="text-sm font-bold text-white">{formatPercent(data.allocationPercent.USDC)}</span>
          </div>
        </div>
      </div>
    </GlowContainer>
  );
}
