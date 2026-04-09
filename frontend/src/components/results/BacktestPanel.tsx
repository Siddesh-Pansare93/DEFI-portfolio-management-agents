"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { NeuralCard, CardLabel } from "@/components/ui/neural-card";

interface BacktestPanelProps {
  /** Portfolio total value */
  portfolioValue: number;
  /** Strategy expected APY (0-1) */
  expectedAPY: number;
}

export function BacktestPanel({ portfolioValue, expectedAPY }: BacktestPanelProps) {
  // Generate simulated 30-day backtest data
  const { data, aiReturn, holdReturn, alpha } = useMemo(() => {
    const days = 30;
    const startValue = portfolioValue || 52000;
    const dailyAiReturn = expectedAPY > 0 ? expectedAPY / 365 : 0.085 / 365;

    // Simulate ETH hold: random walk with slight upward bias
    const holdDailyReturn = 0.0012; // ~4% monthly
    const volatility = 0.025;

    const points: { day: number; date: string; ai: number; hold: number }[] = [];
    let aiValue = startValue;
    let holdValue = startValue;

    // Seed for reproducible "random" walk based on portfolio value
    let seed = Math.abs(Math.round(startValue * 100)) % 10000;
    const pseudoRandom = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647) - 0.5;
    };

    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      points.push({
        day: i,
        date: dateStr,
        ai: Math.round(aiValue),
        hold: Math.round(holdValue),
      });

      if (i < days) {
        const noise = pseudoRandom() * volatility;
        aiValue *= 1 + dailyAiReturn + noise * 0.6; // AI is less volatile
        holdValue *= 1 + holdDailyReturn + noise;
      }
    }

    const finalAi = points[points.length - 1].ai;
    const finalHold = points[points.length - 1].hold;

    return {
      data: points,
      aiReturn: ((finalAi - startValue) / startValue) * 100,
      holdReturn: ((finalHold - startValue) / startValue) * 100,
      alpha: ((finalAi - startValue) / startValue - (finalHold - startValue) / startValue) * 100,
    };
  }, [portfolioValue, expectedAPY]);

  const formatUSD = (v: number) =>
    "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <NeuralCard accentColor="#22C55E" halo>
      <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-white/30" />
        <CardLabel>Historical Performance</CardLabel>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#272F42] rounded-xl p-4">
          <p className="text-[#64748B] text-xs mb-1">AI Strategy</p>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-xl font-bold ${aiReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {aiReturn >= 0 ? "+" : ""}{aiReturn.toFixed(1)}%
            </span>
            {aiReturn >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>

        <div className="bg-[#272F42] rounded-xl p-4">
          <p className="text-[#64748B] text-xs mb-1">ETH Hold</p>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-xl font-bold ${holdReturn >= 0 ? "text-[#94A3B8]" : "text-red-400"}`}>
              {holdReturn >= 0 ? "+" : ""}{holdReturn.toFixed(1)}%
            </span>
            {holdReturn >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>

        <div className="bg-[#272F42] rounded-xl p-4">
          <p className="text-[#64748B] text-xs mb-1">AI Alpha</p>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-xl font-bold ${alpha >= 0 ? "text-[#F59E0B]" : "text-red-400"}`}>
              {alpha >= 0 ? "+" : ""}{alpha.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#F8FAFC",
                fontSize: "12px",
              }}
              formatter={(value, name) => [
                formatUSD(Number(value ?? 0)),
                name === "ai" ? "AI Strategy" : "ETH Hold",
              ]}
              labelStyle={{ color: "#64748B" }}
            />
            <Line
              type="monotone"
              dataKey="ai"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              name="ai"
            />
            <Line
              type="monotone"
              dataKey="hold"
              stroke="#64748B"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="hold"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#F59E0B] rounded" />
          <span className="text-xs text-[#94A3B8]">AI Strategy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#64748B] rounded border-dashed" style={{ borderTop: "1.5px dashed #64748B", height: 0 }} />
          <span className="text-xs text-[#94A3B8]">ETH Hold</span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-[#475569] mt-4 text-center">
        * Based on simulated historical performance. Past results do not guarantee future returns.
      </p>
      </div>
    </NeuralCard>
  );
}
