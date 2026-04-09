"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Bot, Zap, Shield } from "lucide-react";
import { startAnalysis } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Home() {
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

    if (!address) return;

    if (!validateAddress(address)) {
      setError("Invalid Ethereum address format (0x... + 40 chars)");
      return;
    }

    setIsLoading(true);

    try {
      const data = await startAnalysis(address);
      router.push(`/analyze?wallet=${address}&job=${data.jobId}`);
    } catch (err) {
      console.error("Analysis start failed:", err);
      setError("Failed to start analysis. Is the backend running?");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      <NavBar />

      <div className="z-10 w-full max-w-5xl flex flex-col items-center pt-20">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-5 max-w-3xl"
        >
          <h1 className="font-sans font-bold text-5xl md:text-7xl text-white">
            Autonomous DeFi
          </h1>

          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            AI-powered multi-agent system for DeFi portfolio management
          </p>

          {/* Stat Badges */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-[#94A3B8] text-sm border border-[#334155] rounded-full px-4 py-1.5">
              5 AI Agents
            </span>
            <span className="text-[#94A3B8] text-sm border border-[#334155] rounded-full px-4 py-1.5">
              On-Chain Execution
            </span>
            <span className="text-[#94A3B8] text-sm border border-[#334155] rounded-full px-4 py-1.5">
              Risk Validated
            </span>
          </div>
        </motion.div>

        {/* Wallet Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md mt-10 relative"
        >
          <form onSubmit={handleSubmit} className="flex items-center bg-[#1E293B] rounded-xl p-2 border border-[#334155]">
            <Input
              placeholder="Enter Sepolia Wallet Address (0x...)"
              className="h-12 bg-transparent border-none text-white placeholder:text-[#475569] focus-visible:ring-0 focus-visible:ring-offset-0"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !address}
              className={cn(
                "bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl px-6 py-3 hover:bg-[#FBBF24] transition-all shadow-lg shadow-amber-500/20 shrink-0",
                isLoading && "opacity-50"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </form>

          {error && (
            <div className="absolute -bottom-10 left-0 right-0 text-center">
              <span className="text-red-400 text-xs bg-red-950/50 px-3 py-1 rounded-lg border border-red-900/50">
                {error}
              </span>
            </div>
          )}

          <div
            className="absolute -bottom-8 right-0 text-xs text-[#64748B] cursor-pointer hover:text-[#94A3B8] transition-colors"
            onClick={() => {
              setAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4");
              setError(null);
            }}
          >
            Try Demo Wallet
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 w-full px-4"
        >
          <div className="bg-[#222735] border border-[#334155] rounded-2xl p-6">
            <div className="mb-4">
              <Bot className="h-6 w-6 text-[#94A3B8]" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">Multi-Agent AI</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              5 specialized agents analyze, debate, and validate your DeFi strategy
            </p>
          </div>

          <div className="bg-[#222735] border border-[#334155] rounded-2xl p-6">
            <div className="mb-4">
              <Zap className="h-6 w-6 text-[#94A3B8]" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">On-Chain Execution</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Strategies executed via smart contract on Ethereum Sepolia
            </p>
          </div>

          <div className="bg-[#222735] border border-[#334155] rounded-2xl p-6">
            <div className="mb-4">
              <Shield className="h-6 w-6 text-[#94A3B8]" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">Risk Validated</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Every action passes multi-round negotiation and risk validation
            </p>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
