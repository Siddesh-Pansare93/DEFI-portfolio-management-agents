// ============================================================================
// PORTFOLIO DATA TYPES
// ============================================================================

/**
 * Holdings for a single token (ETH or USDC)
 */
export interface TokenHolding {
  balance: number;        // Token balance (decimal format, e.g., 1.5 ETH)
  priceUSD: number;       // Current USD price per token
  valueUSD: number;       // Total value in USD (balance * priceUSD)
}

/**
 * Complete portfolio data including holdings and pool information
 */
export interface PortfolioData {
  holdings: {
    ETH: TokenHolding;
    USDC: TokenHolding;
  };
  totalValueUSD: number;
  allocationPercent: {
    ETH: number;          // Percentage of portfolio in ETH (0-100)
    USDC: number;         // Percentage of portfolio in USDC (0-100)
  };
  uniswapPool: {
    address: string;
    liquidity: number;    // Total value locked in USD
    volume24h: number;    // 24-hour trading volume in USD
    feeAPR: number;       // Annual percentage rate from fees
  };
}

// ============================================================================
// MARKET ANALYSIS TYPES
// ============================================================================

/**
 * Market trend analysis for ETH
 */
export interface MarketAnalysis {
  ethTrend: 'bullish' | 'bearish' | 'neutral';
  ethPriceChange30d: number;      // 30-day price change percentage
  volatility: number;             // Annualized volatility percentage
  marketCondition: 'stable' | 'volatile' | 'uncertain';
  recommendation: 'increase_eth' | 'decrease_eth' | 'maintain';
  reasoning: string;              // 2-3 sentence explanation
}

// ============================================================================
// STRATEGY PROPOSAL TYPES
// ============================================================================

/**
 * Details for adding liquidity to Uniswap V3
 */
export interface AddLiquidityDetails {
  pool: string;                   // Pool name (e.g., "ETH-USDC")
  ethAmount: number;              // Amount of ETH to provide
  usdcAmount: number;             // Amount of USDC to provide
  priceRangeLower: number;        // Lower bound of price range
  priceRangeUpper: number;        // Upper bound of price range
}

/**
 * Details for token swap
 */
export interface SwapDetails {
  fromToken: string;              // Token to sell
  toToken: string;                // Token to buy
  amount: number;                 // Amount to swap
}

/**
 * Union type for strategy details (can be add_liquidity, swap, or null for hold)
 */
export type StrategyDetails = AddLiquidityDetails | SwapDetails | null;

/**
 * Complete strategy proposal from Strategy Agent
 */
export interface StrategyProposal {
  action: 'add_liquidity' | 'swap' | 'hold';
  details: StrategyDetails;
  expectedAPY: number;            // Expected annual percentage yield
  expectedReturn1Year: number;    // Expected return in dollars over 1 year
  reasoning: string;              // 3-5 sentence explanation
}

// ============================================================================
// RISK VALIDATION TYPES
// ============================================================================

/**
 * Risk validation results from Risk Agent
 */
export interface RiskValidation {
  approved: boolean;              // Whether strategy passes risk checks
  riskScore: number;              // 0-1, where 0 is safest
  estimatedMaxIL: number;         // Maximum impermanent loss percentage
  violations: string[];           // List of constraint violations
  adjustedStrategy: StrategyProposal | null;  // Safer alternative if rejected
  reasoning: string;              // Explanation of risk assessment
}

// ============================================================================
// FINAL RECOMMENDATION TYPES
// ============================================================================

/**
 * Final recommendation from Nash Negotiator
 */
export interface FinalRecommendation {
  action: 'add_liquidity' | 'swap' | 'hold';
  details: StrategyDetails;
  expectedAPY: number;            // Expected annual percentage yield
  maxRisk: number;                // Maximum impermanent loss percentage
  confidence: number;             // 0-1, product of return and safety utilities
  explanation: string;            // Combined reasoning from all agents
}

// ============================================================================
// WORKFLOW STATE TYPES
// ============================================================================

/**
 * State object that flows through the LangGraph workflow
 * Each agent reads from and writes to this shared state
 */
export interface WorkflowState {
  walletAddress: string;
  portfolio: PortfolioData | null;
  marketAnalysis: MarketAnalysis | null;
  strategyProposal: StrategyProposal | null;
  riskValidation: RiskValidation | null;
  finalRecommendation: FinalRecommendation | null;
}

// ============================================================================
// JOB MANAGEMENT TYPES
// ============================================================================

/**
 * Job status for tracking workflow execution
 */
export type JobStatus = 'pending' | 'analyzing' | 'complete' | 'error';

/**
 * Job state for in-memory job tracking
 */
export interface JobState {
  jobId: string;
  walletAddress: string;
  status: JobStatus;
  currentAgent: string | null;   // Name of currently executing agent
  progress: number;               // 0-1, percentage of workflow completed
  state: WorkflowState;           // Current workflow state
  result: FinalRecommendation | null;
  error: string | null;
  createdAt: Date;                // When job was created
  completedAt: Date | null;       // When job finished (null if still running)
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Response for POST /api/analyze
 */
export interface AnalyzeResponse {
  jobId: string;
  status: JobStatus;
  message: string;
}

/**
 * Response for GET /api/status/:jobId
 */
export interface StatusResponse {
  jobId: string;
  status: JobStatus;
  currentAgent: string | null;
  progress: number;               // 0-1 progress indicator
  startTime: string;              // ISO 8601 timestamp
  result?: {
    finalRecommendation: FinalRecommendation;
    workflowState: WorkflowState;
  };
  completedTime?: string;         // ISO 8601 timestamp
  error?: string;
}

/**
 * Response for GET /api/portfolio/:walletAddress
 */
export interface PortfolioResponse {
  walletAddress: string;
  holdings: {
    ETH: TokenHolding;
    USDC: TokenHolding;
  };
  totalValueUSD: number;
  fetchedAt: string;              // ISO 8601 timestamp
}

/**
 * Request body for POST /api/log-recommendation
 */
export interface LogRecommendationRequest {
  walletAddress: string;
  action: string;
  details: string;                // JSON stringified details
}

/**
 * Response for POST /api/log-recommendation
 */
export interface LogRecommendationResponse {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
}

/**
 * Request body for POST /api/analyze
 */
export interface AnalyzeRequest {
  walletAddress: string;
  preferences?: Partial<UserPreferences>;
}

// ============================================================================
// USER PREFERENCES TYPES
// ============================================================================

export interface UserPreferences {
  maxImpermanentLoss: number;
  maxPositionSize: number;
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  preferredActions: ('add_liquidity' | 'swap' | 'hold')[];
}

// ============================================================================
// MARKET OVERVIEW TYPES
// ============================================================================

export interface MarketOverviewResponse {
  fearGreedIndex: number;
  fearGreedLabel: string;
  ethPrice: number;
  uniswapTVL: number;
  topTokenPrices: Record<string, number>;
  timestamp: string;
}
