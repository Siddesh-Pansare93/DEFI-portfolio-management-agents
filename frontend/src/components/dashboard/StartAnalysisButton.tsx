"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startAnalysisWithPreferences } from "@/lib/api";
import { UserPreferences } from "@/lib/types";
import { toast } from "sonner";

interface StartAnalysisButtonProps {
  walletAddress: string;
  preferences: UserPreferences;
}

export function StartAnalysisButton({
  walletAddress,
  preferences,
}: StartAnalysisButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartAnalysis = async () => {
    if (!walletAddress) {
      toast.error("Wallet not connected");
      return;
    }

    setIsLoading(true);

    try {
      const response = await startAnalysisWithPreferences(
        walletAddress,
        preferences
      );
      toast.success("Analysis Initiated", {
        description: "Redirecting to Agent Negotiation Theater...",
      });
      router.push(`/analyze?job=${response.jobId}&wallet=${walletAddress}`);
    } catch (error) {
      console.error("Failed to start analysis:", error);
      toast.error("Analysis Failed", {
        description: "Could not start agent workflow. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartAnalysis}
      disabled={isLoading}
      className="w-full h-16 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple hover:from-neon-cyan/80 hover:to-neon-purple/80 text-black font-bold font-orbitron text-lg tracking-wider uppercase shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />

      {isLoading ? (
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Initializing Agents...</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 fill-black" />
          <span>Start AI Analysis</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </Button>
  );
}
