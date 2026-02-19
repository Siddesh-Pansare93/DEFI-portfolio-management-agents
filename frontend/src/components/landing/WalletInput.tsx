"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { startAnalysis } from "@/lib/api";
import { cn } from "@/lib/utils";

export function WalletInput() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address) {
      setError("Please enter a wallet address");
      return;
    }

    if (!validateAddress(address)) {
      setError("Invalid Ethereum address format (0x... + 40 chars)");
      return;
    }

    setIsLoading(true);

    try {
      const data = await startAnalysis(address);
      // Redirect to analysis page with job ID
      router.push(`/analyze?wallet=${address}&job=${data.jobId}`);
    } catch (err) {
      console.error("Analysis start failed:", err);
      setError("Failed to start analysis. Is the backend running?");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter Sepolia Wallet Address (0x...)"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (error) setError(null);
            }}
            className={cn(
              "h-14 px-6 bg-black/80 border-white/10 text-lg font-mono tracking-wider text-white placeholder:text-zinc-500 focus-visible:ring-neon-cyan focus-visible:border-neon-cyan/50 transition-all",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={isLoading}
          />
          <div className="absolute right-2 top-2 bottom-2">
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !address}
              className={cn(
                "h-full w-10 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-md transition-all",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {error && (
        <p className="text-red-400 text-sm font-mono animate-pulse bg-red-950/30 p-2 rounded border border-red-900/50">
          ! ERROR: {error}
        </p>
      )}

      <div className="flex gap-2 text-xs text-zinc-500 font-mono justify-center">
        <span>Try demo wallet:</span>
        <button
          type="button"
          onClick={() => setAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4")}
          className="text-neon-cyan hover:underline cursor-pointer"
        >
          0x742d...bEb4
        </button>
      </div>
    </form>
  );
}
