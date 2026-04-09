"use client";

import { CheckCircle2, ExternalLink, Loader2, Wallet, Clock } from "lucide-react";

interface TransactionStatusProps {
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
}

export function TransactionStatus({
  hash,
  isPending,
  isConfirming,
  isConfirmed,
}: TransactionStatusProps) {
  if (!isPending && !isConfirming && !isConfirmed && !hash) return null;

  const etherscanUrl = hash
    ? `https://sepolia.etherscan.io/tx/${hash}`
    : undefined;

  // State 2: Awaiting wallet approval
  if (isPending) {
    return (
      <div className="bg-[#222735] border border-amber-500/20 rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">
              Confirm in MetaMask
            </h3>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              Please approve the transaction in your wallet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 3 & 4: Submitted / Confirming
  if (isConfirming && hash) {
    return (
      <div className="bg-[#222735] border border-blue-500/20 rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">
              Transaction Submitted
            </h3>
            <p className="text-[#94A3B8] text-xs mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Waiting for confirmation on Sepolia...
            </p>
            <a
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mt-2 transition-colors"
            >
              <span className="font-mono">
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-[#272F42] rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  // State 5: Confirmed
  if (isConfirmed && hash) {
    return (
      <div className="bg-[#222735] border border-emerald-500/20 rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-400 text-sm">
              Strategy Logged On-Chain
            </h3>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              Your AI-recommended strategy has been permanently recorded on
              Ethereum Sepolia.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <a
                href={etherscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                View on Etherscan
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[#64748B] text-xs font-mono">
                {hash.slice(0, 14)}...{hash.slice(-10)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
