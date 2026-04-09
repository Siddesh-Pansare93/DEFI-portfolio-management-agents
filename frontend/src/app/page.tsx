"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Network, Zap, ShieldAlert } from "lucide-react";
import { startAnalysis } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MiniNetwork } from "@/components/neural/MiniNetwork";
import { AmbientBackground } from "@/components/layout/AmbientBackground";

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
      <AmbientBackground showGrid={true} />
      <NavBar />

      <div className="z-10 w-full max-w-5xl flex flex-col items-center pt-20">

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl flex flex-col items-center">
          <MiniNetwork />

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="font-sans font-bold text-[clamp(3rem,6vw,5rem)] leading-none tracking-[-0.03em] text-[#EDEDEF]"
          >
            AUTONOMOUS DEFI
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            className="text-[#8A8F98] text-[1.125rem] font-sans"
          >
            AI agents that think, debate, and execute
          </motion.p>
        </div>

        {/* Wallet Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          className="w-full max-w-md mt-12 relative"
        >
          <div className="glass-card p-1">
            <form onSubmit={handleSubmit} className="flex items-center group/form relative z-10">
              <Input
                placeholder="Enter Sepolia Wallet (0x...)"
                className="h-12 bg-transparent border-none text-white placeholder:text-[#4A4F5A] focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm"
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
                  "bg-violet-500 text-white font-semibold rounded-xl px-5 py-3 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] shrink-0 h-10 mr-1",
                  isLoading && "opacity-50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
              {/* Focus Ring - Tailwind peer/group isn't enough, we'll just style parent on focus within Input using CSS */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-violet-500/30 opacity-0 group-focus-within/form:opacity-100 transition-opacity pointer-events-none -z-10 -m-1" />
            </form>
          </div>

          {error && (
            <div className="absolute -bottom-10 left-0 right-0 text-center">
              <span className="text-[#EF4444] text-xs bg-red-950/20 px-3 py-1 rounded-lg border border-[#EF4444]/20 backdrop-blur-md">
                {error}
              </span>
            </div>
          )}

          <div
            className="absolute -bottom-8 left-0 right-0 text-center text-xs text-[#8A8F98] hover:text-white transition-colors cursor-pointer"
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
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20 w-full px-4"
        >
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="mb-4 text-[#EDEDEF]">
              <Network className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2 font-sans tracking-tight">5 Agents</h3>
            <p className="text-[#8A8F98] text-sm leading-relaxed">
              analyze
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="mb-4 text-[#EDEDEF]">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2 font-sans tracking-tight">On-Chain</h3>
            <p className="text-[#8A8F98] text-sm leading-relaxed">
              execute
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="mb-4 text-[#EDEDEF]">
              <ShieldAlert className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2 font-sans tracking-tight">Risk</h3>
            <p className="text-[#8A8F98] text-sm leading-relaxed">
              validate
            </p>
          </div>
        </motion.div>

      </div>
    </main>
  );
}