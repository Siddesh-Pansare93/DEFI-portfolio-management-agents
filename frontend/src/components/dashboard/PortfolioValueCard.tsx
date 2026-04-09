"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PortfolioValueCardProps {
  totalValueUSD: number;
  change24h?: number; // Optional percentage change
}

export function PortfolioValueCard({
  totalValueUSD,
  change24h = 0,
}: PortfolioValueCardProps) {
  const isPositive = change24h >= 0;

  return (
    <Card className="p-6 bg-black/40 border-white/10 backdrop-blur-md relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-cyan/10 rounded-full blur-[50px] group-hover:bg-neon-cyan/20 transition-colors duration-500" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2 text-zinc-400">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <Wallet className="w-4 h-4 text-neon-cyan" />
          </div>
          <span className="text-sm font-mono uppercase tracking-widest">
            Total Portfolio Value
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-4">
          <h2 className="text-4xl md:text-5xl font-bold font-orbitron text-white tracking-tight">
            $
            {totalValueUSD.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>

        {change24h !== 0 && (
          <div
            className={`mt-2 flex items-center gap-1 text-sm font-mono ${
              isPositive ? "text-neon-green" : "text-neon-orange"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {change24h.toFixed(2)}% (24h)
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
