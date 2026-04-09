"use client";

import { useAgentProgress } from "@/hooks/useAgentProgress";
import { AGENT_DEFINITIONS } from "@/lib/constants";
import { JobStatus, WorkflowState } from "@/lib/types";
import { AgentNode } from "./AgentNode";

interface AgentPipelineProps {
  status: JobStatus;
  workflowState: WorkflowState | null;
  currentAgentName: string | null;
}

export function AgentPipeline({ status, workflowState, currentAgentName }: AgentPipelineProps) {
  const { activeAgentIndex, completedAgents } = useAgentProgress(status, workflowState, currentAgentName);

  const completedCount = completedAgents.filter(Boolean).length;
  const progressPercent = (completedCount / AGENT_DEFINITIONS.length) * 100;

  const getNodeStatus = (index: number): "idle" | "active" | "complete" | "error" => {
    const isActive = index === activeAgentIndex;
    const isComplete = completedAgents[index];
    if (status === "error" && isActive) return "error";
    if (isComplete) return "complete";
    if (isActive) return "active";
    return "idle";
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Progress bar */}
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-xs text-[#94A3B8]">
          <span>Agent Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-1 bg-[#272F42] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F59E0B] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Agent nodes - horizontal on desktop, vertical on mobile */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {AGENT_DEFINITIONS.map((def, index) => (
          <div key={def.name} className="flex flex-col md:flex-row items-center flex-1 min-w-0">
            {/* Agent node */}
            <div className="w-full">
              <AgentNode
                definition={def}
                status={getNodeStatus(index)}
                workflowState={workflowState}
              />
            </div>

            {/* Dotted connector (not after last node) */}
            {index < AGENT_DEFINITIONS.length - 1 && (
              <>
                {/* Desktop: horizontal dotted line */}
                <div className="hidden md:block w-6 flex-shrink-0 border-t border-dashed border-[#334155]" />
                {/* Mobile: vertical dotted line */}
                <div className="md:hidden h-4 flex-shrink-0 border-l border-dashed border-[#334155] self-center" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
