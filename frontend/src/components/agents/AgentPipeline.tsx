"use client";

import { useAgentProgress } from "@/hooks/useAgentProgress";
import { AGENT_DEFINITIONS } from "@/lib/constants";
import { JobStatus, WorkflowState } from "@/lib/types";
import { NeuralNetwork } from "@/components/neural/NeuralNetwork";
import { AgentStatus } from "@/components/neural/NeuralNode";

interface AgentPipelineProps {
  status: JobStatus;
  workflowState: WorkflowState | null;
  currentAgentName: string | null;
}

export function AgentPipeline({ status, workflowState, currentAgentName }: AgentPipelineProps) {
  const { activeAgentIndex, completedAgents } = useAgentProgress(status, workflowState, currentAgentName);

  const completedCount = completedAgents.filter(Boolean).length;
  const progressPercent = (completedCount / AGENT_DEFINITIONS.length) * 100;

  const getNodeStatus = (index: number): AgentStatus => {
    const isActive = index === activeAgentIndex;
    const isComplete = completedAgents[index];
    if (status === "error" && isActive) return "error";
    if (isComplete) return "complete";
    if (isActive) return "active";
    return "idle";
  };

  // Map color names to hex values
  const COLOR_MAP: Record<string, string> = {
    cyan: '#06B6D4',
    blue: '#6366F1',
    yellow: '#F59E0B',
    orange: '#EF4444',
    purple: '#8B5CF6',
  };
  const GLOW_MAP: Record<string, string> = {
    cyan: 'rgba(6, 182, 212, 0.25)',
    blue: 'rgba(99, 102, 241, 0.25)',
    yellow: 'rgba(245, 158, 11, 0.25)',
    orange: 'rgba(239, 68, 68, 0.25)',
    purple: 'rgba(139, 92, 246, 0.30)',
  };

  // Hardcoded positions based on the neural layout spec
  // 1: Data Collector -> 2: Market Analyzer
  // 1: Data Collector -> 4: Risk Validator
  // 2: Market Analyzer -> 3: Strategy Proposer
  // 3: Strategy Proposer -> 4: Risk Validator (ping pong)
  // 4: Risk Validator -> 5: Nash Negotiator
  // 3: Strategy Proposer -> 5: Nash Negotiator
  const POSITIONS = [
    { x: 50, y: 150 },   // Collector (left middle)
    { x: 300, y: 50 },   // Analyzer (top middle)
    { x: 550, y: 100 },  // Strategy (top right)
    { x: 300, y: 250 },  // Risk (bottom middle)
    { x: 550, y: 250 },  // Nash (bottom right)
  ];

  // Map names to specific IDs used by NeuralNetwork connections
  const ID_MAP: Record<string, string> = {
    'Data Collector': 'collector',
    'Market Analyzer': 'analyzer',
    'Strategy Proposer': 'strategy',
    'Risk Validator': 'risk',
    'Nash Negotiator': 'nash'
  };

  const agentStates = AGENT_DEFINITIONS.map((def, idx) => ({
    id: ID_MAP[def.name] || def.name.toLowerCase().split(" ")[0],
    name: def.name,
    status: getNodeStatus(idx),
    message: getNodeStatus(idx) === "active" ? def.message : undefined,
    icon: def.icon,
    colorHex: COLOR_MAP[def.color] || '#8B5CF6',
    glowColor: GLOW_MAP[def.color] || 'rgba(139, 92, 246, 0.25)',
    x: POSITIONS[idx]?.x || 0,
    y: POSITIONS[idx]?.y || 0,
  }));

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="hidden md:block relative w-full h-[400px]">
        <NeuralNetwork agents={agentStates as any} />
      </div>

      {/* Mobile Fallback: Vertical list with lines */}
      <div className="md:hidden flex flex-col items-center gap-4">
        {agentStates.map((agent, index) => (
          <div key={agent.name} className="flex flex-col items-center">
            {/* Very simple representation for mobile fallback using standard components or NeuralNode */}
            <div className="bg-glass border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 flex items-center gap-4 w-[280px]">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${agent.colorHex}20`, color: agent.colorHex }}
              >
                <agent.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#EDEDEF] text-sm font-medium">{agent.name}</div>
                <div className="text-[#8A8F98] text-xs">
                  {agent.status === "active" ? agent.message || "Processing..." : 
                   agent.status === "complete" ? "Complete" : 
                   agent.status === "error" ? "Failed" : "Standby"}
                </div>
              </div>
            </div>
            
            {index < agentStates.length - 1 && (
              <div className="w-0.5 h-6 bg-[rgba(255,255,255,0.1)] my-1" />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[800px] mx-auto space-y-2 mt-4">
        <div className="w-full h-0.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ 
              width: `${progressPercent}%`,
              background: `linear-gradient(to right, #06B6D4, ${agentStates[activeAgentIndex]?.colorHex || '#8B5CF6'})`
            }}
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-[#8A8F98]">
          <span>{currentAgentName || "Initializing..."}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>
    </div>
  );
}