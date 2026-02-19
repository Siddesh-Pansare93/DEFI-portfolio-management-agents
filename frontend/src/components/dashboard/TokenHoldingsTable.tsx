"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TokenHolding } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TokenHoldingsTableProps {
  holdings: Record<string, TokenHolding>;
  totalValueUSD: number;
}

export function TokenHoldingsTable({
  holdings,
  totalValueUSD,
}: TokenHoldingsTableProps) {
  const [showAll, setShowAll] = useState(false);

  // Convert object to array and sort by value (descending)
  const sortedTokens = Object.entries(holdings)
    .map(([symbol, data]) => ({
      symbol,
      ...data,
      allocation: (data.valueUSD / totalValueUSD) * 100,
    }))
    .sort((a, b) => b.valueUSD - a.valueUSD);

  const visibleTokens = showAll ? sortedTokens : sortedTokens.slice(0, 5);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);

  const formatBalance = (val: number) =>
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 6,
    }).format(val);

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-400">
          Token Holdings
        </h3>
        <span className="text-xs text-neon-cyan font-mono bg-neon-cyan/10 px-2 py-1 rounded">
          {sortedTokens.length} ASSETS
        </span>
      </div>

      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/5 hover:bg-white/5">
            <TableHead className="text-xs text-zinc-500 font-mono">
              ASSET
            </TableHead>
            <TableHead className="text-xs text-zinc-500 font-mono text-right">
              BALANCE
            </TableHead>
            <TableHead className="text-xs text-zinc-500 font-mono text-right">
              PRICE
            </TableHead>
            <TableHead className="text-xs text-zinc-500 font-mono text-right">
              VALUE
            </TableHead>
            <TableHead className="text-xs text-zinc-500 font-mono text-right">
              ALLOCATION
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleTokens.map((token) => (
            <TableRow
              key={token.symbol}
              className="border-white/5 hover:bg-white/5 transition-colors group"
            >
              <TableCell className="font-medium font-orbitron text-white group-hover:text-neon-cyan transition-colors">
                {token.symbol}
              </TableCell>
              <TableCell className="text-right font-mono text-zinc-300">
                {formatBalance(token.balance)}
              </TableCell>
              <TableCell className="text-right font-mono text-zinc-400">
                {formatCurrency(token.priceUSD)}
              </TableCell>
              <TableCell className="text-right font-mono text-white">
                {formatCurrency(token.valueUSD)}
              </TableCell>
              <TableCell className="text-right font-mono">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-zinc-400">
                    {token.allocation.toFixed(1)}%
                  </span>
                  <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-purple shadow-[0_0_5px_#bf00ff]"
                      style={{ width: `${token.allocation}%` }}
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {sortedTokens.length > 5 && (
        <div className="p-2 border-t border-white/10 bg-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 h-8"
          >
            {showAll ? (
              <span className="flex items-center gap-1">
                Show Less <ChevronUp className="w-3 h-3" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                View All {sortedTokens.length} Tokens{" "}
                <ChevronDown className="w-3 h-3" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
