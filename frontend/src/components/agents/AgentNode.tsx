"use client";

import { cn } from "@/lib/utils";
import { WorkflowState } from "@/lib/types";
import { AgentDefinition, AgentName } from "@/lib/constants";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface AgentNodeProps {
  definition: AgentDefinition;
  status: "idle" | "active" | "complete" | "error";
  workflowState: WorkflowState | null;
}

const borderLeftColorMap: Record<AgentName, string> = {
  "Data Collector": "border-l-cyan-500",
  "Market Analyzer": "border-l-blue-500",
  "Strategy Proposer": "border-l-amber-500",
  "Risk Validator": "border-l-red-500",
  "Nash Negotiator": "border-l-violet-500",
};

const iconBgMap: Record<AgentName, string> = {
  "Data Collector": "bg-cyan-500/10 text-cyan-500",
  "Market Analyzer": "bg-blue-500/10 text-blue-500",
  "Strategy Proposer": "bg-amber-500/10 text-amber-500",
  "Risk Validator": "bg-red-500/10 text-red-500",
  "Nash Negotiator": "bg-violet-500/10 text-violet-500",
};

const activeRingMap: Record<AgentName, string> = {
  "Data Collector": "ring-1 ring-cyan-500/20",
  "Market Analyzer": "ring-1 ring-blue-500/20",
  "Strategy Proposer": "ring-1 ring-amber-500/20",
  "Risk Validator": "ring-1 ring-red-500/20",
  "Nash Negotiator": "ring-1 ring-violet-500/20",
};

export function AgentNode({ definition, status }: AgentNodeProps) {
  const { name, icon: Icon } = definition;

  const borderLeftClass = borderLeftColorMap[name];
  const iconClasses = iconBgMap[name];
  const activeRing = activeRingMap[name];

  const statusText =
    status === "active"
      ? "Processing..."
      : status === "complete"
        ? "Complete"
        : status === "error"
          ? "Error"
          : "Waiting...";

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 bg-[#222735] border border-[#334155] rounded-2xl p-5 border-l-[3px] transition-all duration-300 w-full",
        borderLeftClass,
        status === "idle" && "opacity-60 border-l-[#334155]",
        status === "active" && cn("opacity-100 scale-[1.02]", activeRing),
        status === "complete" && "opacity-100",
        status === "error" && "opacity-100 border-red-500"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full",
          status === "idle" ? "bg-[#334155]/50 text-[#94A3B8]" : iconClasses
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-sm text-white truncate">{name}</span>
        <span className="text-xs text-[#94A3B8]">{statusText}</span>
      </div>

      {/* Status indicator */}
      <div className="ml-auto flex-shrink-0">
        {status === "active" && (
          <Loader2 className="w-4 h-4 text-[#94A3B8] animate-spin" />
        )}
        {status === "complete" && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
        {status === "error" && (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  );
}
