import { useState, useEffect, useRef } from "react";
import { JobStatus, WorkflowState } from "@/lib/types";
import { AGENT_DEFINITIONS, ANIMATION_DURATION_PER_AGENT } from "@/lib/constants";

export interface ProgressMessage {
  agent: string;
  message: string;
  timestamp: Date;
}

export interface NegotiationMessage {
  round: number;
  from: string;
  type: string;
  content: string;
  keyPoints: string[];
  timestamp: Date;
}

export function useAnalysis() {
  const [status, setStatus] = useState<JobStatus>("pending");
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [currentAgentName, setCurrentAgentName] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [negotiationMessages, setNegotiationMessages] = useState<NegotiationMessage[]>([]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visualTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll backend status
  const startPolling = (id: string) => {
    setJobId(id);
    setStatus("analyzing");
    setError(null);
    setCurrentAgentIndex(0);
    setCurrentAgentName("Data Collector");
    setProgressMessages([]);
    setNegotiationMessages([]);

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

        // Update current agent name from backend
        if (data.currentAgent) {
          setCurrentAgentName(data.currentAgent);
        }

        // Extract progress messages
        if (data.progressMessages && Array.isArray(data.progressMessages)) {
          setProgressMessages(data.progressMessages);
        }

        // Extract negotiation messages
        if (data.negotiationMessages && Array.isArray(data.negotiationMessages)) {
          setNegotiationMessages(data.negotiationMessages);
        }

        // Update partial workflow state (sent during analysis too)
        const partialState = data.workflowState || data.result?.workflowState;
        if (partialState) {
          setWorkflowState(partialState);
        }

        if (data.status === "complete") {
          setStatus("complete");
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
    progressMessages,
    negotiationMessages,
    startPolling
  };
}
