"use client";

import { PortfolioData } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/utils";

interface PortfolioSnapshotProps {
  data: PortfolioData | null;
}

export function PortfolioSnapshot({ data }: PortfolioSnapshotProps) {
  if (!data) return null;

  const { holdings, totalValueUSD, allocationPercent, uniswapPool } = data;

  const stats = [
    {
      label: "Total Value",
      value: formatUSD(totalValueUSD),
    },
    {
      label: "ETH Balance",
      value: `${holdings.ETH.balance.toFixed(4)} ETH`,
      sub: formatUSD(holdings.ETH.valueUSD),
    },
    {
      label: "USDC Balance",
      value: `${holdings.USDC.balance.toFixed(2)} USDC`,
      sub: formatUSD(holdings.USDC.valueUSD),
    },
    {
      label: "ETH Allocation",
      value: formatPercent(allocationPercent.ETH),
    },
    {
      label: "USDC Allocation",
      value: formatPercent(allocationPercent.USDC),
    },
    {
      label: "Pool Volume (24h)",
      value: formatUSD(uniswapPool.volume24h),
    },
  ];

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl p-6 h-full">
      <h3 className="uppercase tracking-wider text-[#64748B] text-xs font-semibold mb-5">
        Portfolio Snapshot
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block">
              {stat.label}
            </span>
            <span className="font-mono text-white text-lg font-medium block">
              {stat.value}
            </span>
            {stat.sub && (
              <span className="text-xs text-[#64748B] font-mono block">
                {stat.sub}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
