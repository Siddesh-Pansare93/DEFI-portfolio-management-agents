"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useAnalysis } from "@/hooks/useAnalysis";
import { NavBar } from "@/components/layout/NavBar";
import { AgentPipeline } from "@/components/agents/AgentPipeline";
import NegotiationChat from "@/components/agents/NegotiationChat";
import { Loader2, AlertCircle, CheckCircle2, Zap } from "lucide-react";
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
import { TechnicalIndicatorsCard } from "@/components/results/TechnicalIndicatorsCard";
import { NewsHeadlinesPanel } from "@/components/results/NewsHeadlinesPanel";
import { WorkflowSummary } from "@/components/results/WorkflowSummary";
import { TransactionStatus } from "@/components/results/TransactionStatus";
import { BacktestPanel } from "@/components/results/BacktestPanel";

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Complete
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <AlertCircle className="w-3.5 h-3.5" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      Analyzing
    </span>
  );
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const wallet = searchParams.get("wallet");
  const jobId = searchParams.get("job");

  const {
    status,
    workflowState,
    error,
    currentAgentName,
    progressMessages,
    negotiationMessages,
    startPolling,
  } = useAnalysis();

  const { data: hash, isPending: isTxPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleExecute = () => {
    if (!workflowState?.finalRecommendation) return;

    // Check if address is placeholder
    if (!REBALANCE_LOGGER_ADDRESS || REBALANCE_LOGGER_ADDRESS.length < 42) {
      toast.warning("Simulation Mode", {
        description: "Contract address is not configured. Execution simulated.",
      });
      return;
    }

    writeContract(
      {
        address: REBALANCE_LOGGER_ADDRESS as `0x${string}`,
        abi: REBALANCE_LOGGER_ABI,
        functionName: "logRecommendation",
        args: [
          workflowState.finalRecommendation.action,
          JSON.stringify(workflowState.finalRecommendation.details || {}),
        ],
      },
      {
        onError: (err) => {
          toast.error("Execution Failed", {
            description: err.message,
          });
        },
      }
    );
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction Confirmed!", {
        description: "Strategy execution logged on-chain.",
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
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-[#0F172A] text-white">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <h1 className="text-xl text-red-400 font-medium">Invalid Request</h1>
        <p className="text-[#94A3B8] text-sm">Missing wallet address or job ID.</p>
        <Link href="/">
          <Button variant="outline" className="border-[#334155] text-[#94A3B8] hover:bg-[#222735] hover:text-white">
            Return Home
          </Button>
        </Link>
      </div>
    );
  }

  const latestProgress =
    progressMessages.length > 0 ? progressMessages[progressMessages.length - 1] : null;

  const showResults =
    status === "complete" ||
    (status === "analyzing" && !!workflowState?.finalRecommendation);

  return (
    <div className="min-h-screen pb-20 bg-[#0F172A] overflow-x-hidden">
      <NavBar />

      <main className="container mx-auto px-4 pt-24 space-y-10">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Agent Pipeline
              </h1>
            </div>
            <p className="text-[#64748B] text-sm">
              Wallet{" "}
              <span className="text-[#94A3B8] bg-[#1E293B] px-2 py-0.5 rounded font-mono text-xs ml-1">
                {wallet}
              </span>
            </p>
          </div>

          {status === "analyzing" && (
            <div className="flex items-center gap-2 text-blue-400/80 text-sm">
              <Zap className="w-4 h-4" />
              <span>Processing agents...</span>
            </div>
          )}
        </div>

        {/* ── Error Display ── */}
        {error && (
          <div className="bg-[#222735] border border-red-500/30 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-red-400">Execution Failed</h3>
                  <p className="text-sm text-[#94A3B8] mt-0.5">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full md:w-auto"
                onClick={() => window.location.reload()}
              >
                Retry Analysis
              </Button>
            </div>
          </div>
        )}

        {/* ── Agent Pipeline ── */}
        <section>
          <AgentPipeline
            status={status}
            workflowState={workflowState}
            currentAgentName={currentAgentName}
          />
        </section>

        {/* ── Latest Progress Message ── */}
        {latestProgress && status === "analyzing" && (
          <div className="text-sm text-[#94A3B8] font-mono">
            <span className="text-[#64748B]">[{latestProgress.agent}]</span>{" "}
            {latestProgress.message}
          </div>
        )}

        {/* ── Negotiation Chat ── */}
        {negotiationMessages.length > 0 && (
          <section>
            <NegotiationChat messages={negotiationMessages} status={status} />
          </section>
        )}

        {/* ── Results Section ── */}
        <AnimatePresence>
          {showResults && workflowState && (
            <motion.div
              key="results-container"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Divider */}
              <div className="relative border-t border-[#334155] pt-10">
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#0F172A] px-4 text-[#64748B] text-xs uppercase tracking-widest">
                  Strategic Output
                </div>
              </div>

              {/* 1. Final Recommendation Card */}
              <FinalRecommendationCard
                recommendation={workflowState.finalRecommendation!}
                onExecute={handleExecute}
                isExecuting={isTxPending || isConfirming}
              />

              {/* Transaction Status */}
              <TransactionStatus
                hash={hash}
                isPending={isTxPending}
                isConfirming={isConfirming}
                isConfirmed={isConfirmed}
              />

              {/* 2. Charts Grid - 4 cols on lg, 2 on md, 1 on sm */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[350px]">
                <PortfolioDonut data={workflowState.portfolio} />
                <RiskGauge score={workflowState.riskValidation?.riskScore || 0} />
                <NashBargainingViz
                  safetyUtility={1 - (workflowState.riskValidation?.riskScore || 0)}
                  returnUtility={
                    workflowState.strategyProposal?.expectedAPY
                      ? Math.min(workflowState.strategyProposal.expectedAPY * 5, 1)
                      : 0
                  }
                  disagreementPoint={{ x: 0.2, y: 0.1 }}
                />
                <ConfidenceMeter confidence={workflowState.finalRecommendation!.confidence} />
              </div>

              {/* 3. Portfolio Snapshot + Market Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PortfolioSnapshot data={workflowState.portfolio} />
                <MarketAnalysisPanel data={workflowState.marketAnalysis} />
              </div>

              {/* 4. Technical Indicators + News Headlines */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TechnicalIndicatorsCard
                  data={(workflowState as any).technicalIndicators ?? null}
                />
                <NewsHeadlinesPanel
                  headlines={(workflowState as any).newsHeadlines ?? null}
                />
              </div>

              {/* 5. Backtesting Panel */}
              {workflowState.finalRecommendation && (
                <BacktestPanel
                  portfolioValue={workflowState.portfolio?.totalValueUSD || 52000}
                  expectedAPY={workflowState.finalRecommendation.expectedAPY || 0.085}
                />
              )}

              {/* 6. Workflow Summary */}
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
