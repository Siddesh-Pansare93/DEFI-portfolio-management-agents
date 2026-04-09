"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MarketPulseBarProps {
  fearGreedIndex: number;
  fearGreedLabel: string;
  ethPrice: number;
  uniswapTVL: number;
}

export function MarketPulseBar({
  fearGreedIndex,
  fearGreedLabel,
  ethPrice,
  uniswapTVL,
}: MarketPulseBarProps) {
  // Determine Fear & Greed color
  const getFearGreedColor = (val: number) => {
    if (val <= 25) return "#ff4d4d"; // Extreme Fear (Red)
    if (val <= 45) return "#ff9900"; // Fear (Orange)
    if (val <= 55) return "#ffee00"; // Neutral (Yellow)
    if (val <= 75) return "#ccff00"; // Greed (Light Green)
    return "#00ff00"; // Extreme Greed (Green)
  };

  const fgColor = getFearGreedColor(fearGreedIndex);

  // Data for the semi-circle gauge
  const gaugeData = [
    { name: "Value", value: fearGreedIndex, color: fgColor },
    { name: "Remaining", value: 100 - fearGreedIndex, color: "#333" },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Fear & Greed Section */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="relative w-16 h-8">
          <ResponsiveContainer width="100%" height="200%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius="60%"
                outerRadius="100%"
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-400">
            0-100
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Fear & Greed
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-xl font-bold font-orbitron"
              style={{ color: fgColor }}
            >
              {fearGreedIndex}
            </span>
            <span className="text-xs text-white/80 font-mono">
              [{fearGreedLabel}]
            </span>
          </div>
        </div>
      </div>

      {/* Divider (Desktop) */}
      <div className="hidden md:block w-px h-10 bg-white/10" />

      {/* ETH Price */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="p-2 rounded-full bg-neon-blue/10 border border-neon-blue/20">
          <DollarSign className="w-4 h-4 text-neon-blue" />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            ETH Price
          </div>
          <div className="text-xl font-bold text-white font-orbitron">
            {formatCurrency(ethPrice)}
          </div>
        </div>
      </div>

      {/* Divider (Desktop) */}
      <div className="hidden md:block w-px h-10 bg-white/10" />

      {/* Uniswap TVL */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="p-2 rounded-full bg-neon-purple/10 border border-neon-purple/20">
          <Activity className="w-4 h-4 text-neon-purple" />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Uniswap TVL
          </div>
          <div className="text-xl font-bold text-white font-orbitron">
            ${formatCompact(uniswapTVL)}
          </div>
        </div>
      </div>
    </div>
  );
}
