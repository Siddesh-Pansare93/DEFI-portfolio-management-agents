// ============================================================================
// PORTFOLIO DATA TYPES
// ============================================================================

/**
 * Holdings for a single token
 */
export interface TokenHolding {
  balance: number;        // Token balance (decimal format, e.g., 1.5 ETH)
  priceUSD: number;       // Current USD price per token
  valueUSD: number;       // Total value in USD (balance * priceUSD)
}

/**
 * Complete portfolio data including holdings and pool information
 * Now supports all 25 tokens, not just ETH/USDC
 */
export interface PortfolioData {
  holdings: Record<string, TokenHolding>; // All tokens by symbol
  topHoldings: string[];                   // Top 5 symbols by value
  totalValueUSD: number;
  allocationPercent: Record<string, number>; // % allocation per token
  dominantToken: string;                   // Symbol with largest holding
  uniswapPool: {
    address: string;
    liquidity: number;    // Total value locked in USD
    volume24h: number;    // 24-hour trading volume in USD
    feeAPR: number;       // Annual percentage rate from fees
  };
  diversificationScore: number; // 0-1 (HHI-based)
}

// ============================================================================
// MARKET ANALYSIS TYPES
// ============================================================================

/**
 * News item with sentiment
 */
export interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Deep market analysis (replaces MarketAnalysis, includes LLM + indicators)
 */
export interface DeepMarketAnalysis {
  ethTrend: 'bullish' | 'bearish' | 'neutral';
  ethPriceChange30d: number;
  volatility: number;
  marketCondition: 'stable' | 'volatile' | 'uncertain';
  recommendation: 'increase_eth' | 'decrease_eth' | 'maintain';
  fearGreedIndex: number;
  fearGreedLabel: string;
  sentimentScore: number;       // -1 to 1
  newsHeadlines: NewsItem[];    // Top 5 articles
  technicalIndicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number; percentB?: number };
    ema7: number;
    ema30: number;
    signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  };
  uniswapTVL: number;
  uniswapTVLChange24h: number;
  supportLevel: number;
  resistanceLevel: number;
  macroSignal: 'risk_on' | 'risk_off' | 'neutral';
  analysisConfidence: number;   // 0-1
  geminiReasoning: string;      // Full LLM reasoning text
  reasoning: string;            // Alias for geminiReasoning (backwards compat)
}

// Backwards-compatible alias
export type MarketAnalysis = DeepMarketAnalysis;

// ============================================================================
// NEGOTIATION TYPES
// ============================================================================

export interface NegotiationMessage {
  round: number;
  from: 'StrategyProposer' | 'RiskValidator' | 'NashNegotiator';
  type: 'proposal' | 'critique' | 'refinement' | 'counter_proposal' |
        'concession' | 'agreement' | 'escalation' | 'final_decision';
  content: string;           // Full human-readable reasoning
  proposalRef?: string;      // Which proposal version (v1, v2...)
  keyPoints: string[];       // Bullet points for quick display
  timestamp: Date;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserPreferences {
  maxImpermanentLoss: number;   // Default 10
  maxPositionSize: number;      // Default 70
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  preferredActions: ('add_liquidity' | 'swap' | 'hold')[];
}

// ============================================================================
// STRATEGY PROPOSAL TYPES
// ============================================================================

/**
 * Details for adding liquidity to Uniswap V3
 */
export interface AddLiquidityDetails {
  pool: string;
  ethAmount: number;
  usdcAmount: number;
  priceRangeLower: number;
  priceRangeUpper: number;
}

/**
 * Details for token swap
 */
export interface SwapDetails {
  fromToken: string;
  toToken: string;
  amount: number;
}

export type StrategyDetails = AddLiquidityDetails | SwapDetails | null;

/**
 * Strategy proposal (versioned for multi-round negotiation)
 */
export interface StrategyProposal {
  action: 'add_liquidity' | 'swap' | 'hold';
  details: StrategyDetails;
  expectedAPY: number;
  expectedReturn1Year: number;
  reasoning: string;
  version?: number;             // Round version (v1, v2, ...)
  geminiReasoning?: string;     // Full LLM text if available
}

// ============================================================================
// RISK VALIDATION TYPES
// ============================================================================

export interface RiskValidation {
  approved: boolean;
  riskScore: number;            // 0-1
  estimatedMaxIL: number;
  violations: string[];
  adjustedStrategy: StrategyProposal | null;
  reasoning: string;
  geminiReasoning?: string;     // Full LLM critique text
  round?: number;               // Which negotiation round
}

// ============================================================================
// FINAL RECOMMENDATION TYPES
// ============================================================================

export interface FinalRecommendation {
  action: 'add_liquidity' | 'swap' | 'hold';
  details: StrategyDetails;
  expectedAPY: number;
  maxRisk: number;
  confidence: number;           // 0-1
  explanation: string;
  negotiationRounds?: number;   // How many rounds it took
  nashExplanation?: string;     // Gemini-authored explanation
}

// ============================================================================
// WORKFLOW STATE TYPES
// ============================================================================

/**
 * State object that flows through the LangGraph workflow
 */
export interface WorkflowState {
  walletAddress: string;
  userPreferences: UserPreferences | null;        // NEW
  portfolio: PortfolioData | null;
  marketAnalysis: DeepMarketAnalysis | null;       // Was: MarketAnalysis
  deepMarketAnalysis: DeepMarketAnalysis | null;   // Alias for marketAnalysis
  strategyProposal: StrategyProposal | null;       // Current proposal
  strategyProposals: StrategyProposal[];           // All versions
  currentProposal: StrategyProposal | null;        // Alias for strategyProposal
  riskValidation: RiskValidation | null;
  negotiationRound: number;                        // Current round (1-10)
  negotiationMessages: NegotiationMessage[];       // Full chat history
  finalRecommendation: FinalRecommendation | null;
}

// ============================================================================
// JOB MANAGEMENT TYPES
// ============================================================================

export type JobStatus = 'pending' | 'analyzing' | 'complete' | 'error';

export interface JobState {
  jobId: string;
  walletAddress: string;
  status: JobStatus;
  currentAgent: string | null;
  progress: number;
  state: WorkflowState;
  result: FinalRecommendation | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// ============================================================================
// TOOL FUNCTION TYPES
// ============================================================================

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface PoolData {
  address: string;
  liquidity: number;
  token0Price: number;
  token1Price: number;
  volumeUSD: number;
  feesUSD: number;
}

export interface OptimalRangeResult {
  lowerPrice: number;
  upperPrice: number;
  lowerTick: number;
  upperTick: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface AnalyzeResponse {
  jobId: string;
  status: JobStatus;
  message: string;
}

export interface StatusResponse {
  jobId: string;
  status: JobStatus;
  currentAgent: string | null;
  progress: number;
  startTime: string;
  negotiationRound?: number;
  negotiationMessages?: NegotiationMessage[];
  result?: {
    finalRecommendation: FinalRecommendation;
    workflowState: WorkflowState;
  };
  completedTime?: string;
  error?: string;
}

export interface PortfolioResponse {
  walletAddress: string;
  holdings: Record<string, TokenHolding>;
  totalValueUSD: number;
  fetchedAt: string;
}

export interface LogRecommendationRequest {
  walletAddress: string;
  action: string;
  details: string;
}

export interface LogRecommendationResponse {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
}

export interface AnalyzeRequest {
  walletAddress: string;
  preferences?: Partial<UserPreferences>;
}

export interface MarketOverviewResponse {
  fearGreedIndex: number;
  fearGreedLabel: string;
  ethPrice: number;
  uniswapTVL: number;
  topTokenPrices: Record<string, number>;
  timestamp: string;
}
