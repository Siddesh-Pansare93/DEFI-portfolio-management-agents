"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AgentConnectorProps {
  status: "active" | "complete" | "idle";
  orientation: "horizontal" | "vertical";
  length?: number;
}

export function AgentConnector({ status, orientation, length = 60 }: AgentConnectorProps) {
  const isActive = status === "active" || status === "complete";
  const isCompleted = status === "complete";

  const variants = {
    idle: {
      pathLength: 0,
      opacity: 0.1,
    },
    active: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1, ease: "easeInOut" },
    },
  };

  if (orientation === "horizontal") {
    return (
      <div className="relative flex items-center justify-center w-full h-1 overflow-visible">
        {/* Base line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 rounded-full" />
        
        {/* Active line */}
        <motion.div
          className={cn("absolute top-1/2 left-0 h-0.5 bg-neon-cyan -translate-y-1/2 rounded-full", 
            isCompleted ? "shadow-[0_0_10px_#00ffff]" : ""
          )}
          initial={{ width: 0 }}
          animate={{ width: isActive ? "100%" : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Moving particle effect */}
        {status === "active" && (
          <motion.div
            className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-neon-cyan -translate-y-1/2 shadow-[0_0_15px_#00ffff]"
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    );
  } else {
    // Vertical for mobile
    return (
      <div className="relative flex flex-col items-center justify-center w-1 h-20 overflow-visible my-[-10px]">
        {/* Base line */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/10 -translate-x-1/2 rounded-full" />
        
        {/* Active line */}
        <motion.div
          className={cn("absolute left-1/2 top-0 w-0.5 bg-neon-cyan -translate-x-1/2 rounded-full",
            isCompleted ? "shadow-[0_0_10px_#00ffff]" : ""
          )}
          initial={{ height: 0 }}
          animate={{ height: isActive ? "100%" : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Moving particle effect */}
        {status === "active" && (
          <motion.div
            className="absolute left-1/2 top-0 w-2 h-2 rounded-full bg-neon-cyan -translate-x-1/2 shadow-[0_0_15px_#00ffff]"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    );
  }
}
