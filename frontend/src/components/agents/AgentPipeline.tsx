"use client";

import { motion } from "framer-motion";
import { useAgentProgress } from "@/hooks/useAgentProgress";
import { AGENT_DEFINITIONS } from "@/lib/constants";
import { JobStatus, WorkflowState } from "@/lib/types";
import { AgentNode } from "./AgentNode";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AgentPipelineProps {
  status: JobStatus;
  workflowState: WorkflowState | null;
  currentAgentName: string | null;
}

export function AgentPipeline({ status, workflowState, currentAgentName }: AgentPipelineProps) {
  const { activeAgentIndex, completedAgents } = useAgentProgress(status, workflowState, currentAgentName);

  // Calculate overall progress based on completed agents
  const completedCount = completedAgents.filter(Boolean).length;
  const progressPercent = (completedCount / AGENT_DEFINITIONS.length) * 100;

  // Helper to determine node status
  const getNodeStatus = (index: number) => {
    const isActive = index === activeAgentIndex;
    const isComplete = completedAgents[index];
    if (status === "error" && isActive) return "error";
    if (isComplete) return "complete";
    if (isActive) return "active";
    return "idle";
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 relative pb-20">
      {/* Top Progress Bar */}
      <div className="w-full max-w-2xl space-y-2 relative z-20 mb-8">
        <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase tracking-widest">
          <span>System Synchronization</span>
          <span className="text-neon-cyan">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-1 bg-white/10" indicatorClassName="bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
      </div>

      {/* Circuit Board Layout Container */}
      <div className="relative w-full max-w-5xl p-4 md:p-8">
        
        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-y-24 gap-x-8 relative z-10">
          
          {/* Row 1 */}
          {/* Agent 1: Data Collector */}
          <div className="relative group md:col-start-1 md:row-start-1 flex justify-center">
             <AgentNode 
               definition={AGENT_DEFINITIONS[0]} 
               status={getNodeStatus(0)} 
               workflowState={workflowState}
               delay={0}
             />
             {/* Connector to Right (Desktop) */}
             <div className="hidden md:block absolute -right-[50%] top-1/2 w-full h-1 bg-white/5 -z-10">
               <motion.div 
                 className="h-full bg-neon-cyan shadow-[0_0_10px_#00ffff]"
                 initial={{ width: 0 }}
                 animate={{ width: completedAgents[0] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
             {/* Connector Down (Mobile) */}
             <div className="md:hidden absolute -bottom-12 left-1/2 w-1 h-12 bg-white/5 -z-10 -translate-x-1/2">
                <motion.div 
                 className="w-full bg-neon-cyan shadow-[0_0_10px_#00ffff]"
                 initial={{ height: 0 }}
                 animate={{ height: completedAgents[0] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
          </div>

          {/* Agent 2: Market Analyzer */}
          <div className="relative group md:col-start-2 md:row-start-1 flex justify-center">
             <AgentNode 
               definition={AGENT_DEFINITIONS[1]} 
               status={getNodeStatus(1)} 
               workflowState={workflowState}
               delay={1}
             />
             {/* Connector to Right (Desktop) */}
             <div className="hidden md:block absolute -right-[50%] top-1/2 w-full h-1 bg-white/5 -z-10">
               <motion.div 
                 className="h-full bg-neon-blue shadow-[0_0_10px_#4488ff]"
                 initial={{ width: 0 }}
                 animate={{ width: completedAgents[1] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
             {/* Connector Down (Mobile) */}
             <div className="md:hidden absolute -bottom-12 left-1/2 w-1 h-12 bg-white/5 -z-10 -translate-x-1/2">
                <motion.div 
                 className="w-full bg-neon-blue shadow-[0_0_10px_#4488ff]"
                 initial={{ height: 0 }}
                 animate={{ height: completedAgents[1] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
          </div>

          {/* Agent 3: Strategy Proposer */}
          <div className="relative group md:col-start-3 md:row-start-1 flex justify-center">
             <AgentNode 
               definition={AGENT_DEFINITIONS[2]} 
               status={getNodeStatus(2)} 
               workflowState={workflowState}
               delay={2}
             />
             {/* Connector Down (Desktop) */}
             <div className="hidden md:block absolute left-1/2 top-[100%] w-1 h-24 bg-white/5 -z-10 -translate-x-1/2">
               <motion.div 
                 className="w-full bg-neon-yellow shadow-[0_0_10px_#ffee00]"
                 initial={{ height: 0 }}
                 animate={{ height: completedAgents[2] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
             {/* Connector Down (Mobile) */}
             <div className="md:hidden absolute -bottom-12 left-1/2 w-1 h-12 bg-white/5 -z-10 -translate-x-1/2">
                <motion.div 
                 className="w-full bg-neon-yellow shadow-[0_0_10px_#ffee00]"
                 initial={{ height: 0 }}
                 animate={{ height: completedAgents[2] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
          </div>

          {/* Row 2 - Reverse Direction */}

          {/* Agent 4: Risk Validator */}
          <div className="relative group md:col-start-3 md:row-start-2 flex justify-center">
             <AgentNode 
               definition={AGENT_DEFINITIONS[3]} 
               status={getNodeStatus(3)} 
               workflowState={workflowState}
               delay={3}
             />
             {/* Connector to Left (Desktop) */}
             <div className="hidden md:block absolute -left-[50%] top-1/2 w-full h-1 bg-white/5 -z-10">
               <motion.div 
                 className="h-full bg-neon-orange shadow-[0_0_10px_#ff6600] float-right"
                 initial={{ width: 0 }}
                 animate={{ width: completedAgents[3] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
             {/* Connector Down (Mobile) */}
             <div className="md:hidden absolute -bottom-12 left-1/2 w-1 h-12 bg-white/5 -z-10 -translate-x-1/2">
                <motion.div 
                 className="w-full bg-neon-orange shadow-[0_0_10px_#ff6600]"
                 initial={{ height: 0 }}
                 animate={{ height: completedAgents[3] ? "100%" : 0 }}
                 transition={{ duration: 1 }}
               />
             </div>
          </div>

          {/* Agent 5: Nash Negotiator */}
          <div className="relative group md:col-start-2 md:row-start-2 flex justify-center">
             <AgentNode 
               definition={AGENT_DEFINITIONS[4]} 
               status={getNodeStatus(4)} 
               workflowState={workflowState}
               delay={4}
             />
             {/* Connector to Left (Desktop - Final output line to nowhere/center) */}
             <div className="hidden md:block absolute -left-[50%] top-1/2 w-1/2 h-1 bg-gradient-to-l from-neon-purple to-transparent -z-10 opacity-50" />
          </div>

        </div>

        {/* Central Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-neon-cyan/5 rounded-full blur-[100px] -z-20 pointer-events-none animate-pulse hidden md:block" />
      </div>
    </div>
  );
}
