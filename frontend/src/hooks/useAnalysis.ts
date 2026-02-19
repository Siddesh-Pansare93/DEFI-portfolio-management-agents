import { useState, useEffect, useRef } from "react";
import { JobStatus, WorkflowState } from "@/lib/types";
import { AGENT_DEFINITIONS, ANIMATION_DURATION_PER_AGENT } from "@/lib/constants";

export function useAnalysis() {
  const [status, setStatus] = useState<JobStatus>("pending");
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [jobId, setJobId] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visualTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll backend status
  const startPolling = (id: string) => {
    setJobId(id);
    setStatus("analyzing");
    setError(null);
    setCurrentAgentIndex(0); // Start visual flow

    // Clear existing intervals
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (visualTimerRef.current) clearInterval(visualTimerRef.current);

    // Visual Timer: Advance agent every N seconds if status is still analyzing
    visualTimerRef.current = setInterval(() => {
      setCurrentAgentIndex((prev) => {
        if (prev < AGENT_DEFINITIONS.length - 1) return prev + 1;
        return prev; // Stay on last agent until complete
      });
    }, ANIMATION_DURATION_PER_AGENT);

    // Backend Polling
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/status/${id}`);
        if (!res.ok) throw new Error("Status check failed");
        
        const data = await res.json();
        
        if (data.status === "complete") {
          setStatus("complete");
          setResult(data.result);
          setWorkflowState(data.result.workflowState);
          setCurrentAgentIndex(AGENT_DEFINITIONS.length); // All done
          
          // Stop timers
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (visualTimerRef.current) clearInterval(visualTimerRef.current);
        } else if (data.status === "error") {
          setStatus("error");
          setError(data.error || "Unknown error");
          
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (visualTimerRef.current) clearInterval(visualTimerRef.current);
        } else {
          // Update partial state if available
          if (data.workflowState) {
            setWorkflowState(data.workflowState);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (visualTimerRef.current) clearInterval(visualTimerRef.current);
    };
  }, []);

  return {
    status,
    currentAgentIndex,
    jobId,
    workflowState,
    result,
    error,
    startPolling
  };
}
