"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WorkflowState } from "@/lib/types";
import { AgentDefinition } from "@/lib/constants";
import { AgentAvatar } from "./AgentAvatar";
import { TypingText } from "./TypingText";
import { NeonBadge } from "@/components/shared/NeonBadge";
import { AgentOutputPanel } from "./AgentOutputPanel";

interface AgentNodeProps {
  definition: AgentDefinition;
  status: "idle" | "active" | "complete" | "error";
  workflowState: WorkflowState | null;
  delay?: number;
}

export function AgentNode({ definition, status, workflowState, delay = 0 }: AgentNodeProps) {
  const { name, icon, color, message } = definition;

  const borderColor = {
    idle: "border-white/5",
    active: `border-neon-${color}/50 shadow-[0_0_15px_rgba(var(--neon-${color}-rgb),0.3)]`,
    complete: `border-neon-${color} shadow-[0_0_10px_rgba(var(--neon-${color}-rgb),0.5)]`,
    error: "border-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      className={cn(
        "relative flex flex-col items-center p-6 rounded-xl border bg-black/40 backdrop-blur-md w-full md:w-64 transition-all duration-500",
        status === "active" ? "scale-105 z-10 bg-black/60" : "",
        status === "idle" ? "opacity-50 grayscale" : "",
        borderColor[status]
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        {status === "active" && (
          <NeonBadge label="PROCESSING" color={color} size="sm" className="animate-pulse" />
        )}
        {status === "complete" && (
          <NeonBadge label="DONE" color="green" size="sm" />
        )}
      </div>

      {/* Avatar */}
      <AgentAvatar status={status} icon={icon} color={color} className="mb-4" />

      {/* Name */}
      <h3 className={cn("font-orbitron font-bold text-lg text-center mb-2 transition-colors", 
        status === "idle" ? "text-zinc-500" : "text-white"
      )}>
        {name}
      </h3>

      {/* Dynamic Message / Typing Text */}
      <div className="h-12 flex items-center justify-center text-center w-full">
        {status === "active" ? (
          <TypingText text={message} className="text-neon-cyan" speed={30} />
        ) : status === "complete" ? (
          <span className="text-zinc-400 text-xs italic">Task completed successfully.</span>
        ) : (
          <span className="text-zinc-600 text-xs">Waiting for initialization...</span>
        )}
      </div>

      {/* Output Panel (Collapsible) */}
      <AgentOutputPanel 
        agentName={name} 
        data={workflowState} 
        isOpen={status === "complete"} 
      />
      
      {/* Decorative corners */}
      <div className={cn("absolute top-0 left-0 w-3 h-3 border-t border-l rounded-tl-lg transition-colors", 
        status === "idle" ? "border-white/10" : `border-neon-${color}`
      )} />
      <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-b border-r rounded-br-lg transition-colors", 
        status === "idle" ? "border-white/10" : `border-neon-${color}`
      )} />
    </motion.div>
  );
}
