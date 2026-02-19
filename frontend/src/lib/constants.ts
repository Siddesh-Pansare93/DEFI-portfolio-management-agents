import { Database, TrendingUp, Lightbulb, Shield, Scale } from "lucide-react";
import { WorkflowState } from "./types";

export type AgentName = 
  | 'Data Collector'
  | 'Market Analyzer'
  | 'Strategy Proposer'
  | 'Risk Validator'
  | 'Nash Negotiator';

export interface AgentDefinition {
  name: AgentName;
  icon: React.ElementType;
  color: "cyan" | "blue" | "yellow" | "orange" | "purple";
  message: string;
  completionCheck: (state: WorkflowState | null) => boolean;
  description: string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    name: 'Data Collector',
    icon: Database,
    color: 'cyan',
    message: "Scanning Sepolia blockchain...",
    completionCheck: (state) => state?.portfolio !== null,
    description: "Fetches on-chain portfolio balances and Uniswap pool data."
  },
  {
    name: 'Market Analyzer',
    icon: TrendingUp,
    color: 'blue',
    message: "Analyzing 30-day price data...",
    completionCheck: (state) => state?.marketAnalysis !== null,
    description: "Calculates volatility, trends, and market conditions."
  },
  {
    name: 'Strategy Proposer',
    icon: Lightbulb,
    color: 'yellow',
    message: "Computing optimal DeFi strategy...",
    completionCheck: (state) => state?.strategyProposal !== null,
    description: "Generates yield optimization strategies based on market data."
  },
  {
    name: 'Risk Validator',
    icon: Shield,
    color: 'orange',
    message: "Validating risk parameters...",
    completionCheck: (state) => state?.riskValidation !== null,
    description: "Simulates impermanent loss and checks safety constraints."
  },
  {
    name: 'Nash Negotiator',
    icon: Scale,
    color: 'purple',
    message: "Computing Nash equilibrium...",
    completionCheck: (state) => state?.finalRecommendation !== null,
    description: "Balances risk vs. reward to find the optimal equilibrium."
  }
];

export const ANIMATION_DURATION_PER_AGENT = 9000; // 9 seconds per agent for visual timer
export const TOTAL_ANIMATION_DURATION = ANIMATION_DURATION_PER_AGENT * 5; // 45 seconds total
