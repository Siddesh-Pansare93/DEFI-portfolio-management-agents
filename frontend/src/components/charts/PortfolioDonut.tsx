"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PortfolioData } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/utils";

const TOKEN_COLORS: Record<string, string> = {
  ETH: "#F59E0B",
  USDC: "#3B82F6",
  USDT: "#8B5CF6",
  DAI: "#06B6D4",
  WBTC: "#22C55E",
  LINK: "#EF4444",
};

interface PortfolioDonutProps {
  data: PortfolioData | null;
}

export function PortfolioDonut({ data }: PortfolioDonutProps) {
  if (!data) return null;

  const chartData = Object.entries(data.holdings).map(([token, holding]) => ({
    name: token,
    value: holding.valueUSD,
    color: TOKEN_COLORS[token] || "#64748B",
  }));

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-4">
        Current Portfolio
      </h3>

      <div className="w-full h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E2433",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value) => formatUSD(Number(value ?? 0))}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-[10px] text-[#64748B] uppercase tracking-wider">
            Total
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {formatUSD(data.totalValueUSD)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
        {Object.entries(data.allocationPercent).map(([token, pct]) => (
          <div key={token} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: TOKEN_COLORS[token] || "#64748B" }}
            />
            <span className="text-xs text-[#94A3B8]">{token}</span>
            <span className="text-xs font-medium text-white">
              {formatPercent(pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
