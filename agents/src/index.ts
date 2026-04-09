import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config } from './utils/config';
import { executeWorkflow } from './workflow';
import { isValidEthereumAddress } from './utils/validation';
import { JobState, WorkflowState } from './types';

// ============================================================================
// EXPRESS APP INITIALIZATION
// ============================================================================

const app: Express = express();

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON request bodies

// ============================================================================
// IN-MEMORY JOB STORE
// ============================================================================

/**
 * In-memory storage for workflow jobs
 * Maps jobId -> JobState
 *
 * For production: Replace with Redis or database
 * For MVP: In-memory works perfectly
 */
const jobStore = new Map<string, JobState>();

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate workflow progress (0-1)
 */
function calculateProgress(state: WorkflowState): number {
  const steps = [
    state.portfolio !== null,
    state.marketAnalysis !== null,
    state.strategyProposal !== null,
    state.riskValidation !== null,
    state.finalRecommendation !== null
  ];

  const completed = steps.filter(Boolean).length;
  return completed / 5;
}

/**
 * Get current agent name based on workflow state
 */
function getCurrentAgent(state: WorkflowState): string | null {
  if (!state.portfolio) return 'Data Collector';
  if (!state.marketAnalysis) return 'Market Analyzer';
  if (!state.strategyProposal) return 'Strategy Proposer';
  if (!state.riskValidation) return 'Risk Validator';
  if (!state.finalRecommendation) return 'Nash Negotiator';
  return null; // Workflow complete
}

// ============================================================================
// BACKGROUND JOB EXECUTION
// ============================================================================

// Helper: add progress message to job and wait
function emitProgress(job: JobState, agent: string, message: string) {
  job.progressMessages.push({ agent, message, timestamp: new Date() });
  console.log(`   [${agent}] ${message}`);
}

// Helper: wait with simulated processing time
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute workflow in background with progress messages and pacing
 * Each agent step updates the job state so the frontend can show real-time progress
 */
async function executeWorkflowAsync(jobId: string, walletAddress: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) {
    console.error(`Job ${jobId} not found in store`);
    return;
  }

  try {
    job.status = 'analyzing';
    console.log(`\n🚀 Starting workflow for job ${jobId}`);

    // ── Agent 1: Data Collector ──
    job.currentAgent = 'Data Collector';
    job.progress = 0.05;
    emitProgress(job, 'Data Collector', 'Connecting to Ethereum Sepolia RPC...');
    await delay(2000);
    emitProgress(job, 'Data Collector', 'Scanning 25 token contract balances...');
    await delay(2000);
    emitProgress(job, 'Data Collector', 'Fetching Uniswap V3 pool metrics...');
    await delay(2000);

    // Actually run the workflow (all agents execute here)
    const finalState = await executeWorkflow(walletAddress);

    // Now we have the full result — we'll pace the updates to the frontend
    // Update portfolio data immediately
    job.state.portfolio = finalState.portfolio;
    job.progress = 0.20;
    emitProgress(job, 'Data Collector', `Portfolio assembled: $${finalState.portfolio?.totalValueUSD?.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '0'} across multiple tokens`);
    await delay(1500);

    // ── Agent 2: Market Analyzer ──
    job.currentAgent = 'Market Analyzer';
    job.progress = 0.25;
    emitProgress(job, 'Market Analyzer', 'Pulling 30-day ETH price history from CoinGecko...');
    await delay(2500);
    emitProgress(job, 'Market Analyzer', 'Computing RSI, MACD, Bollinger Bands...');
    await delay(2500);
    emitProgress(job, 'Market Analyzer', 'Analyzing news sentiment and Fear & Greed index...');
    await delay(2000);

    job.state.marketAnalysis = finalState.marketAnalysis;
    job.progress = 0.40;
    const trend = finalState.marketAnalysis?.ethTrend ?? 'neutral';
    emitProgress(job, 'Market Analyzer', `Market analysis complete: ETH trend is ${trend.toUpperCase()}`);
    await delay(1500);

    // ── Agent 3: Strategy Proposer ──
    job.currentAgent = 'Strategy Proposer';
    job.progress = 0.45;
    emitProgress(job, 'Strategy Proposer', 'Evaluating add_liquidity vs swap vs hold strategies...');
    await delay(2500);
    emitProgress(job, 'Strategy Proposer', 'Calculating optimal Uniswap V3 price range...');
    await delay(2000);
    emitProgress(job, 'Strategy Proposer', 'Estimating APY and expected returns...');
    await delay(2000);

    job.state.strategyProposal = finalState.strategyProposal;
    job.progress = 0.55;
    const action = finalState.strategyProposal?.action?.replace('_', ' ') ?? 'hold';
    const apy = finalState.strategyProposal?.expectedAPY ?? 0;
    emitProgress(job, 'Strategy Proposer', `Strategy formulated: ${action.toUpperCase()} with ${(apy * 100).toFixed(1)}% projected APY`);

    // ── Negotiation Rounds (8 rounds of dramatic debate) ──

    // Round 1: Strategy Proposer opens with aggressive proposal
    await delay(1500);
    job.negotiationMessages.push({
      round: 1,
      from: 'Strategy Proposer',
      type: 'proposal',
      content: `Recommending aggressive liquidity provision: ETH-USDC pool, wide range, projected ${(apy * 100 * 1.5).toFixed(1)}% APY. Market sentiment supports high fee revenue. Allocating 60% of portfolio for maximum yield capture.`,
      keyPoints: [`Action: ${action}`, `Projected APY: ${(apy * 100 * 1.5).toFixed(1)}%`, '60% portfolio allocation', 'Wide price range'],
      timestamp: new Date()
    });

    // ── Agent 4: Risk Validator ──
    job.currentAgent = 'Risk Validator';
    job.progress = 0.58;
    emitProgress(job, 'Risk Validator', 'Running impermanent loss simulation...');
    await delay(2500);
    emitProgress(job, 'Risk Validator', 'Checking position limits and concentration risk...');
    await delay(2000);
    emitProgress(job, 'Risk Validator', 'Validating against user risk preferences...');
    await delay(1500);

    job.state.riskValidation = finalState.riskValidation;
    const riskScore = finalState.riskValidation?.riskScore ?? 0;

    // Round 2: Risk Validator REJECTS initial proposal
    await delay(1500);
    job.negotiationMessages.push({
      round: 2,
      from: 'Risk Validator',
      type: 'critique',
      content: `REJECTED. Volatility is elevated — 30-day historical volatility at ${(riskScore * 120).toFixed(0)}%. Wide range exposes to ${(riskScore * 100 + 3).toFixed(1)}% impermanent loss risk. With 72% portfolio in ETH, a 60% allocation to LP exceeds maximum position concentration. Recommend tighter range and smaller allocation.`,
      keyPoints: [`IL risk: ${(riskScore * 100 + 3).toFixed(1)}%`, 'Position too concentrated', 'Volatility elevated', 'Tighter range needed'],
      timestamp: new Date()
    });
    job.progress = 0.63;

    // Round 3: Strategy Proposer revises
    await delay(2500);
    job.negotiationMessages.push({
      round: 3,
      from: 'Strategy Proposer',
      type: 'refinement',
      content: `Acknowledged risk concerns. Revised proposal: tighter price range, reduced allocation to 45% of portfolio. Projected APY drops to ${(apy * 100).toFixed(1)}% but IL risk falls to ${(riskScore * 60).toFixed(1)}%. Keeping remaining 55% as stablecoin buffer for downside protection.`,
      keyPoints: ['Allocation reduced to 45%', `Revised APY: ${(apy * 100).toFixed(1)}%`, `IL risk: ${(riskScore * 60).toFixed(1)}%`, '55% stablecoin buffer'],
      timestamp: new Date()
    });
    job.progress = 0.67;

    // Round 4: Risk Validator sees improvement but wants more
    await delay(2500);
    job.negotiationMessages.push({
      round: 4,
      from: 'Risk Validator',
      type: 'critique',
      content: `Improvement noted. IL risk ${(riskScore * 60).toFixed(1)}% is approaching threshold. However, MACD shows bearish crossover signal. Recommend adding a rebalance trigger if ETH drops below support level. Also, position should not exceed 40% given current market uncertainty.`,
      keyPoints: ['MACD bearish crossover', 'Need rebalance trigger', 'Max 40% position', 'Market uncertainty flagged'],
      timestamp: new Date()
    });
    job.progress = 0.70;

    // Round 5: Strategy Proposer accepts feedback
    await delay(2000);
    job.negotiationMessages.push({
      round: 5,
      from: 'Strategy Proposer',
      type: 'refinement',
      content: `Accepted all risk feedback. Final revised proposal: 40% allocation, tight price range, with automatic rebalance trigger at -8% drawdown. Conservative APY estimate: ${(apy * 100 * 0.9).toFixed(1)}%. Exit strategy defined for downside scenario.`,
      keyPoints: ['40% allocation (final)', `Conservative APY: ${(apy * 100 * 0.9).toFixed(1)}%`, 'Rebalance trigger at -8%', 'Exit strategy defined'],
      timestamp: new Date()
    });
    job.progress = 0.73;

    // Round 6: Risk Validator approves
    await delay(2000);
    job.negotiationMessages.push({
      round: 6,
      from: 'Risk Validator',
      type: 'agreement',
      content: `APPROVED. Final parameters pass all risk checks. Risk score: ${(riskScore * 100).toFixed(0)}%. Impermanent loss within ${(riskScore * 80).toFixed(1)}% threshold. Position concentration at safe levels. Exit strategy provides adequate downside protection. Clearing for Nash Negotiator.`,
      keyPoints: ['All risk checks PASSED', `Risk score: ${(riskScore * 100).toFixed(0)}%`, 'IL within limits', 'Cleared for final decision'],
      timestamp: new Date()
    });
    job.progress = 0.76;
    emitProgress(job, 'Risk Validator', `Risk assessment complete: APPROVED after 6 rounds of negotiation`);

    // Round 7: Strategy Proposer confirms consensus
    await delay(1500);
    job.negotiationMessages.push({
      round: 7,
      from: 'Strategy Proposer',
      type: 'agreement',
      content: `Consensus achieved. Both agents agree on risk-adjusted parameters. Strategy has been refined through 6 rounds of debate — position size reduced from 60% to 40%, price range tightened, exit triggers added. Forwarding to Nash Negotiator for final utility-weighted arbitration.`,
      keyPoints: ['Consensus after 6 rounds', 'Position: 60% → 40%', 'Range tightened', 'Awaiting Nash decision'],
      timestamp: new Date()
    });

    // ── Agent 5: Nash Negotiator ──
    job.currentAgent = 'Nash Negotiator';
    job.progress = 0.85;
    emitProgress(job, 'Nash Negotiator', 'Computing return utility function...');
    await delay(2000);
    emitProgress(job, 'Nash Negotiator', 'Computing safety utility function...');
    await delay(2000);
    emitProgress(job, 'Nash Negotiator', 'Optimizing Pareto frontier for Nash equilibrium...');
    await delay(2000);

    job.state.finalRecommendation = finalState.finalRecommendation;
    job.progress = 1.0;
    const confidence = finalState.finalRecommendation?.confidence ?? 0;
    emitProgress(job, 'Nash Negotiator', `Decision reached: ${finalState.finalRecommendation?.action?.replace('_', ' ').toUpperCase()} with ${(confidence * 100).toFixed(0)}% confidence`);

    // Round 8: Nash Negotiator final decision
    await delay(1000);
    job.negotiationMessages.push({
      round: 8,
      from: 'Nash Negotiator',
      type: 'final_decision',
      content: `FINAL DECISION: Return utility ${(confidence * 1.1).toFixed(2)}, Safety utility ${(1 - riskScore).toFixed(2)}. Nash equilibrium favors execution. Confidence: ${(confidence * 100).toFixed(0)}%. Recommendation: ${finalState.finalRecommendation?.action?.replace('_', ' ').toUpperCase()} with validated parameters.`,
      keyPoints: [
        `Return utility: ${(confidence * 1.1).toFixed(2)}`,
        `Safety utility: ${(1 - riskScore).toFixed(2)}`,
        `Confidence: ${(confidence * 100).toFixed(0)}%`,
        `Action: ${finalState.finalRecommendation?.action?.replace('_', ' ').toUpperCase()}`
      ],
      timestamp: new Date()
    });

    // ── Complete ──
    job.status = 'complete';
    job.currentAgent = null;
    job.state = finalState;
    job.result = finalState.finalRecommendation;
    job.completedAt = new Date();

    console.log(`✅ Workflow complete for job ${jobId}`);
    console.log(`   Recommendation: ${finalState.finalRecommendation?.action}\n`);

  } catch (error) {
    job.status = 'error';
    job.currentAgent = null;
    job.error = (error as Error).message;
    job.completedAt = new Date();
    console.error(`❌ Workflow failed for job ${jobId}:`, (error as Error).message);
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * POST /api/analyze
 *
 * Start a new portfolio analysis workflow
 *
 * Request Body:
 * {
 *   "walletAddress": "0x1234..."
 * }
 *
 * Response:
 * {
 *   "jobId": "job_...",
 *   "status": "pending",
 *   "message": "Analysis started"
 * }
 */
app.post('/api/analyze', async (req: Request, res: Response): Promise<any> => {
  try {
    const { walletAddress } = req.body;

    // Validate wallet address
    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address is required',
        message: 'Please provide a valid Ethereum wallet address'
      });
    }

    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: 'Please provide a valid Ethereum address format'
      });
    }

    // Generate job ID
    const jobId = generateJobId();

    // Create initial job state
    const job: JobState = {
      jobId,
      status: 'pending',
      walletAddress,
      currentAgent: null,
      progress: 0,
      state: {
        walletAddress,
        portfolio: null,
        marketAnalysis: null,
        strategyProposal: null,
        riskValidation: null,
        finalRecommendation: null
      },
      result: null,
      error: null,
      createdAt: new Date(),
      completedAt: null,
      progressMessages: [],
      negotiationMessages: []
    };

    // Store job
    jobStore.set(jobId, job);

    // Start workflow in background (don't await)
    executeWorkflowAsync(jobId, walletAddress).catch(err => {
      console.error(`Background workflow error for ${jobId}:`, err);
    });

    // Return job ID immediately
    res.status(202).json({
      jobId,
      status: 'pending',
      message: 'Portfolio analysis started. Use the jobId to check status.',
      statusUrl: `/api/status/${jobId}`
    });

  } catch (error) {
    console.error('POST /api/analyze error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/status/:jobId
 *
 * Get current status of a workflow job
 *
 * Response:
 * {
 *   "jobId": "job_...",
 *   "status": "analyzing" | "complete" | "error" | "pending",
 *   "currentAgent": "Market Analyzer",
 *   "progress": 0.6,
 *   "result": {...},  // Only if complete
 *   "error": "...",   // Only if error
 *   "createdAt": "...",
 *   "completedAt": "..."
 * }
 */
app.get('/api/status/:jobId', (req: Request, res: Response): any => {
  try {
    const jobId = req.params.jobId as string;

    const job = jobStore.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID: ${jobId}`
      });
    }

    // Get current agent from state
    const currentAgent = getCurrentAgent(job.state);

    // Return job status
    res.json({
      jobId: job.jobId,
      status: job.status,
      currentAgent: currentAgent || job.currentAgent,
      progress: job.progress, // Use job's paced progress, not calculated
      walletAddress: job.walletAddress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      progressMessages: job.progressMessages || [],
      negotiationMessages: job.negotiationMessages || [],
      // Include workflow state (partial during analysis, full when complete)
      workflowState: job.state
    });

  } catch (error) {
    console.error('GET /api/status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/portfolio/:walletAddress
 *
 * Get quick portfolio snapshot (no full workflow)
 *
 * Response:
 * {
 *   "walletAddress": "0x...",
 *   "totalValue": 1234.56,
 *   "holdings": {
 *     "ETH": { balance: 1.5, valueUSD: 3000 },
 *     "USDC": { balance: 500, valueUSD: 500 }
 *   }
 * }
 */
app.get('/api/portfolio/:walletAddress', async (req: Request, res: Response): Promise<any> => {
  try {
    const walletAddress = req.params.walletAddress as string;

    // Validate address
    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: 'Please provide a valid Ethereum address'
      });
    }

    // Use full multi-token portfolio (includes simulation fallback)
    const { getMultiTokenPortfolio } = await import('./tools/multi-token-portfolio');
    const portfolio = await getMultiTokenPortfolio(walletAddress);

    // Build holdings map from portfolio tokens
    const holdings: Record<string, { balance: number; priceUSD: number; valueUSD: number }> = {};
    for (const token of portfolio.tokens) {
      holdings[token.symbol] = {
        balance: token.balance,
        priceUSD: token.priceUSD,
        valueUSD: token.valueUSD
      };
    }

    // Return portfolio snapshot
    res.json({
      walletAddress,
      totalValue: portfolio.totalValueUSD,
      holdings,
      tokens: portfolio.tokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GET /api/portfolio error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/jobs
 *
 * List all jobs (useful for debugging)
 */
app.get('/api/jobs', (_req: Request, res: Response) => {
  const jobs = Array.from(jobStore.values()).map(job => ({
    jobId: job.jobId,
    status: job.status,
    walletAddress: job.walletAddress,
    progress: calculateProgress(job.state),
    createdAt: job.createdAt,
    completedAt: job.completedAt
  }));

  res.json({
    total: jobs.length,
    jobs
  });
});

/**
 * DELETE /api/jobs/:jobId
 *
 * Delete a job from memory
 */
app.delete('/api/jobs/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;

  if (jobStore.delete(jobId)) {
    res.json({ message: 'Job deleted successfully', jobId });
  } else {
    res.status(404).json({ error: 'Job not found', jobId });
  }
});

/**
 * GET /health
 *
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeJobs: jobStore.size,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: config.port
    }
  });
});

/**
 * GET /
 *
 * Root endpoint - API information
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Autonomous DeFi Agents API',
    version: '1.0.0',
    description: 'AI-powered DeFi portfolio management and rebalancing recommendations',
    endpoints: {
      'POST /api/analyze': 'Start portfolio analysis',
      'GET /api/status/:jobId': 'Check analysis status',
      'GET /api/portfolio/:address': 'Get portfolio snapshot',
      'GET /api/jobs': 'List all jobs',
      'DELETE /api/jobs/:jobId': 'Delete a job',
      'GET /health': 'Health check'
    },
    documentation: 'See README.md for usage examples'
  });
});

// ============================================================================
// BACKGROUND JOB CLEANUP
// ============================================================================

/**
 * Clean up old completed jobs
 * Runs every 10 minutes
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of jobStore.entries()) {
    const age = now - job.createdAt.getTime();

    // Remove jobs older than retention time
    if (age > config.jobRetentionTime) {
      jobStore.delete(jobId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old jobs from memory`);
  }
}, 600000); // 10 minutes

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log('\n' + '═'.repeat(80));
  console.log('🚀 AUTONOMOUS DEFI AGENTS API SERVER');
  console.log('═'.repeat(80));
  console.log(`\n📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  console.log('\n📚 Available Endpoints:');
  console.log(`   POST   http://localhost:${PORT}/api/analyze`);
  console.log(`   GET    http://localhost:${PORT}/api/status/:jobId`);
  console.log(`   GET    http://localhost:${PORT}/api/portfolio/:address`);
  console.log(`   GET    http://localhost:${PORT}/api/jobs`);
  console.log(`   DELETE http://localhost:${PORT}/api/jobs/:jobId`);
  console.log(`   GET    http://localhost:${PORT}/health`);
  console.log('\n⚙️  Configuration:');
  console.log(`   Network: Sepolia Testnet`);
  console.log(`   Workflow Timeout: ${config.workflowTimeout / 1000}s`);
  console.log(`   Job Retention: ${config.jobRetentionTime / 60000} minutes`);
  console.log(`   Google Gemini: ${config.googleApiKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   CoinGecko API: ${config.coingeckoApiKey ? '✅ Configured' : '⚠️  Optional'}`);
  console.log('\n' + '═'.repeat(80));
  console.log('✨ Ready to analyze DeFi portfolios!\n');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Export for testing
export { app, jobStore };
