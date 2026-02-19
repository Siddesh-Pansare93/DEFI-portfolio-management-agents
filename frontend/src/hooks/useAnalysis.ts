import { useState, useEffect, useRef } from "react";
import { JobStatus, WorkflowState } from "@/lib/types";
import { AGENT_DEFINITIONS, ANIMATION_DURATION_PER_AGENT } from "@/lib/constants";

export function useAnalysis() {
  const [status, setStatus] = useState<JobStatus>("pending");
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [currentAgentName, setCurrentAgentName] = useState<string | null>(null);
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
    setCurrentAgentIndex(0);
    setCurrentAgentName("Data Collector");

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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/status/${id}`);
        if (!res.ok) throw new Error("Status check failed");
        
        const data = await res.json();
        
        // Update current agent name from backend
        if (data.currentAgent) {
          setCurrentAgentName(data.currentAgent);
        }

        if (data.status === "complete") {
          setStatus("complete");
          
          // Fix: workflowState might be at root level OR inside result, depending on backend structure
          // Based on user feedback, it seems to be at root level or nested differently
          const finalState = data.workflowState || data.result?.workflowState;
          
          if (finalState) {
            setWorkflowState(finalState);
          }
          
          setResult(data.result);
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
          const partialState = data.workflowState || data.result?.workflowState;
          if (partialState) {
            setWorkflowState(partialState);
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
    currentAgentName,
    jobId,
    workflowState,
    result,
    error,
    startPolling
  };
}
