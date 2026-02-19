import { useState, useEffect } from "react";
import { AGENT_DEFINITIONS } from "@/lib/constants";
import { JobStatus, WorkflowState } from "@/lib/types";

// This hook purely manages visual progress based on time + backend status
// It advances to the next agent every N seconds if backend says "analyzing"
// But jumps to "complete" if backend finishes early

const STEP_DURATION = 9000; // 9s per agent

export function useAgentProgress(
  status: JobStatus,
  workflowState: WorkflowState | null
) {
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<boolean[]>(
    new Array(AGENT_DEFINITIONS.length).fill(false)
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status === "pending") {
      setActiveAgentIndex(-1);
      setCompletedAgents(new Array(AGENT_DEFINITIONS.length).fill(false));
    } else if (status === "complete") {
      // All agents complete
      setActiveAgentIndex(AGENT_DEFINITIONS.length);
      setCompletedAgents(new Array(AGENT_DEFINITIONS.length).fill(true));
    } else if (status === "analyzing") {
      // Check real completion based on data presence in workflowState
      const realCompletion = AGENT_DEFINITIONS.map((agent) =>
        agent.completionCheck(workflowState)
      );
      
      // Find the last completed agent index based on real data
      const lastCompletedIndex = realCompletion.lastIndexOf(true);
      
      // If we have real data that pushes us forward, update immediately
      if (lastCompletedIndex >= activeAgentIndex) {
        setActiveAgentIndex(lastCompletedIndex + 1);
      } else if (activeAgentIndex === -1) {
        // Start at 0 if just beginning
        setActiveAgentIndex(0);
      }

      setCompletedAgents(realCompletion);

      // Visual Timer: Advance automatically every N seconds to simulate activity
      // This keeps the UI feeling alive even if backend polling is slow or agents take time
      timer = setInterval(() => {
        setActiveAgentIndex((prev) => {
          // Don't advance past the last agent index
          if (prev < AGENT_DEFINITIONS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, STEP_DURATION);
    } else {
      // Error or unknown state
      setActiveAgentIndex(-1);
      setCompletedAgents(new Array(AGENT_DEFINITIONS.length).fill(false));
    }

    return () => clearInterval(timer);
  }, [status, workflowState]); 

  return { activeAgentIndex, completedAgents };
}
