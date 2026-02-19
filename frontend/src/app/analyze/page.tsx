"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import { useAnalysis } from "@/hooks/useAnalysis";
import { NavBar } from "@/components/layout/NavBar";
import { AgentPipeline } from "@/components/agents/AgentPipeline";
import { GlowContainer } from "@/components/layout/GlowContainer";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { REBALANCE_LOGGER_ABI, REBALANCE_LOGGER_ADDRESS } from "@/lib/abi";

// Results Components
import { FinalRecommendationCard } from "@/components/results/FinalRecommendationCard";
import { PortfolioDonut } from "@/components/charts/PortfolioDonut";
import { RiskGauge } from "@/components/charts/RiskGauge";
import { ConfidenceMeter } from "@/components/charts/ConfidenceMeter";
import { NashBargainingViz } from "@/components/charts/NashBargainingViz";
import { PortfolioSnapshot } from "@/components/results/PortfolioSnapshot";
import { MarketAnalysisPanel } from "@/components/results/MarketAnalysisPanel";
import { WorkflowSummary } from "@/components/results/WorkflowSummary";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const wallet = searchParams.get("wallet");
  const jobId = searchParams.get("job");
  
  const { 
    status, 
    workflowState, 
    error, 
    startPolling 
  } = useAnalysis();

  const { data: hash, isPending: isTxPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleExecute = () => {
    if (!workflowState?.finalRecommendation) return;

    writeContract({
      address: REBALANCE_LOGGER_ADDRESS as `0x${string}`,
      abi: REBALANCE_LOGGER_ABI,
      functionName: "logRebalance",
      args: [
        workflowState.finalRecommendation.action,
        BigInt(0),
      ],
    }, {
      onError: (err) => {
        toast.error("Execution Failed", {
          description: err.message
        });
      }
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction Confirmed!", {
        description: "Strategy execution logged on-chain."
      });
    }
  }, [isConfirmed]);

  // Polling Effect
  useEffect(() => {
    if (jobId) {
      startPolling(jobId);
    }
  }, [jobId]);

  if (!wallet || !jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-bg-void text-white">
        <h1 className="text-xl text-red-500 font-mono">Invalid Request</h1>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  const showResults = status === "complete" && workflowState?.finalRecommendation;

  return (
    <div className="min-h-screen pb-20 bg-bg-void overflow-x-hidden">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-24 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${status === "complete" ? "bg-neon-green" : "bg-neon-cyan animate-pulse"}`} />
              <span className={`text-xs font-mono tracking-widest uppercase ${status === "complete" ? "text-neon-green" : "text-neon-cyan"}`}>
                {status === "complete" ? "ANALYSIS COMPLETE" : "LIVE ANALYSIS IN PROGRESS"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-white">
              Agent Pipeline Theater
            </h1>
            <p className="text-zinc-400 mt-1 font-mono text-sm">
              Target: <span className="text-white bg-white/10 px-2 py-0.5 rounded ml-1">{wallet}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
             {status === "analyzing" && (
                <div className="flex items-center gap-2 text-neon-cyan/80 text-sm font-mono animate-pulse bg-neon-cyan/10 px-3 py-1 rounded-full border border-neon-cyan/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PROCESSING
                </div>
             )}
             {status === "error" && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-mono bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                  SYSTEM ERROR
                </div>
             )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <GlowContainer glowColor="orange" intensity="high" className="bg-red-950/20 border-red-500/50">
             <div className="flex items-center gap-4 text-red-400">
               <AlertCircle className="w-6 h-6" />
               <div>
                 <h3 className="font-bold">Execution Failed</h3>
                 <p className="text-sm font-mono opacity-80">{error}</p>
               </div>
             </div>
          </GlowContainer>
        )}

        {/* Main Pipeline Visualization */}
        <div className="py-8">
          <AgentPipeline status={status} workflowState={workflowState} />
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && workflowState && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Divider */}
              <div className="border-t border-white/10 pt-12 flex items-center justify-center">
                <div className="bg-bg-void px-4 -mt-14 text-zinc-500 font-mono text-sm uppercase tracking-widest">
                  Strategic Output
                </div>
              </div>

              {/* 1. Final Recommendation Card */}
              <FinalRecommendationCard 
                recommendation={workflowState.finalRecommendation!} 
                onExecute={handleExecute}
                isExecuting={isTxPending || isConfirming}
              />

              {/* 2. Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-auto md:h-80">
                <PortfolioDonut data={workflowState.portfolio} />
                <RiskGauge score={workflowState.riskValidation?.riskScore || 0} />
                <NashBargainingViz 
                  safetyUtility={1 - (workflowState.riskValidation?.riskScore || 0)} // Inverse of risk
                  returnUtility={workflowState.strategyProposal?.expectedAPY ? Math.min(workflowState.strategyProposal.expectedAPY * 5, 1) : 0} // Normalize APY roughly
                  disagreementPoint={{ x: 0.2, y: 0.1 }}
                />
                <ConfidenceMeter confidence={workflowState.finalRecommendation!.confidence} />
              </div>

              {/* 3. Detailed Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PortfolioSnapshot data={workflowState.portfolio} />
                <MarketAnalysisPanel data={workflowState.marketAnalysis} />
              </div>

              {/* 4. Full Trace Accordion */}
              <WorkflowSummary state={workflowState} />

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-void">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
