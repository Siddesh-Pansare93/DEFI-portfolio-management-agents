import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config } from './utils/config';
import { executeWorkflow } from './workflow';
import { isValidEthereumAddress } from './utils/validation';
import { JobState, WorkflowState, UserPreferences } from './types';

// ============================================================================
// EXPRESS APP INITIALIZATION
// ============================================================================

const app: Express = express();

app.use(cors());
app.use(express.json());

// ============================================================================
// IN-MEMORY JOB STORE
// ============================================================================

const jobStore = new Map<string, JobState>();

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateProgress(state: WorkflowState): number {
  const steps = [
    state.portfolio !== null,
    state.marketAnalysis !== null,
    state.strategyProposal !== null,
    state.riskValidation !== null,
    state.finalRecommendation !== null
  ];
  return steps.filter(Boolean).length / 5;
}

function getCurrentAgent(state: WorkflowState): string | null {
  if (!state.portfolio) return 'Data Collector';
  if (!state.marketAnalysis) return 'Market Analyzer';
  if (state.negotiationRound && state.negotiationRound > 0 && !state.finalRecommendation) {
    const round = state.negotiationRound;
    if (!state.riskValidation) return `Strategy Proposer (Round ${round})`;
    return `Risk Validator (Round ${round})`;
  }
  if (!state.strategyProposal) return 'Strategy Proposer';
  if (!state.riskValidation) return 'Risk Validator';
  if (!state.finalRecommendation) return 'Nash Negotiator';
  return null;
}

// ============================================================================
// BACKGROUND JOB EXECUTION
// ============================================================================

async function executeWorkflowAsync(
  jobId: string,
  walletAddress: string,
  userPreferences?: Partial<UserPreferences>
): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) return;

  try {
    job.status = 'analyzing';
    job.currentAgent = 'Data Collector';

    console.log(`\n🚀 Starting workflow for job ${jobId} | Wallet: ${walletAddress}`);

    const finalState = await executeWorkflow(walletAddress, userPreferences);

    job.status = 'complete';
    job.currentAgent = null;
    job.state = finalState;
    job.result = finalState.finalRecommendation;
    job.completedAt = new Date();

    console.log(`✅ Workflow complete for job ${jobId} | Action: ${finalState.finalRecommendation?.action}`);

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
 * Start portfolio analysis with optional user preferences
 *
 * Body: { walletAddress: string, preferences?: Partial<UserPreferences> }
 */
app.post('/api/analyze', async (req: Request, res: Response): Promise<any> => {
  try {
    const { walletAddress, preferences } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const jobId = generateJobId();

    const job: JobState = {
      jobId,
      status: 'pending',
      walletAddress,
      currentAgent: null,
      progress: 0,
      state: {
        walletAddress,
        userPreferences: preferences || null,
        portfolio: null,
        marketAnalysis: null,
        deepMarketAnalysis: null,
        strategyProposal: null,
        currentProposal: null,
        strategyProposals: [],
        riskValidation: null,
        negotiationRound: 0,
        negotiationMessages: [],
        finalRecommendation: null
      },
      result: null,
      error: null,
      createdAt: new Date(),
      completedAt: null
    };

    jobStore.set(jobId, job);

    executeWorkflowAsync(jobId, walletAddress, preferences).catch(err => {
      console.error(`Background workflow error for ${jobId}:`, err);
    });

    res.status(202).json({
      jobId,
      status: 'pending',
      message: 'Portfolio analysis started. Use the jobId to check status.',
      statusUrl: `/api/status/${jobId}`
    });

  } catch (error) {
    console.error('POST /api/analyze error:', error);
    res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
  }
});

/**
 * GET /api/status/:jobId
 *
 * Get current job status including negotiation messages
 */
app.get('/api/status/:jobId', (req: Request, res: Response): any => {
  try {
    const jobId = req.params.jobId as string;
    const job = jobStore.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found', message: `No job found with ID: ${jobId}` });
    }

    const progress = calculateProgress(job.state);
    const currentAgent = getCurrentAgent(job.state);

    res.json({
      jobId: job.jobId,
      status: job.status,
      currentAgent: currentAgent || job.currentAgent,
      progress,
      walletAddress: job.walletAddress,
      negotiationRound: job.state.negotiationRound || 0,
      negotiationMessages: job.state.negotiationMessages || [],
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      ...(job.status === 'complete' && { workflowState: job.state })
    });

  } catch (error) {
    console.error('GET /api/status error:', error);
    res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
  }
});

/**
 * GET /api/portfolio/:walletAddress
 *
 * Quick portfolio snapshot
 */
app.get('/api/portfolio/:walletAddress', async (req: Request, res: Response): Promise<any> => {
  try {
    const walletAddress = req.params.walletAddress as string;

    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const { getMultiTokenPortfolio } = await import('./tools/multi-token-portfolio');

    const portfolio = await getMultiTokenPortfolio(walletAddress);

    res.json({
      walletAddress,
      totalValueUSD: portfolio.totalValueUSD,
      holdings: Object.fromEntries(
        portfolio.tokens.map(t => [t.symbol, { balance: t.balance, priceUSD: t.priceUSD, valueUSD: t.valueUSD }])
      ),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GET /api/portfolio error:', error);
    res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
  }
});

/**
 * GET /api/market-overview
 *
 * Quick market snapshot: Fear & Greed, ETH price, Uniswap TVL
 */
app.get('/api/market-overview', async (_req: Request, res: Response): Promise<any> => {
  try {
    const { getFearGreedIndex } = await import('./tools/fear-greed');
    const { getUniswapTVL } = await import('./tools/defi-llama');
    const { getTokenPrice, getMultipleTokenPrices } = await import('./tools/price-fetcher');

    const [fearGreed, uniswapTVL, ethPrice] = await Promise.all([
      getFearGreedIndex(),
      getUniswapTVL(),
      getTokenPrice(config.tokenSymbols.ETH)
    ]);

    // Fetch a few key token prices
    const keyTokenIds = [
      config.tokenSymbols.USDC,
      config.tokenSymbols.UNI,
      config.tokenSymbols.AAVE,
      config.tokenSymbols.LINK
    ];
    const priceMap = await getMultipleTokenPrices(keyTokenIds);

    const topTokenPrices: Record<string, number> = {
      ETH: ethPrice,
      USDC: priceMap.get(config.tokenSymbols.USDC) || 1,
      UNI: priceMap.get(config.tokenSymbols.UNI) || 0,
      AAVE: priceMap.get(config.tokenSymbols.AAVE) || 0,
      LINK: priceMap.get(config.tokenSymbols.LINK) || 0
    };

    res.json({
      fearGreedIndex: fearGreed.value,
      fearGreedLabel: fearGreed.label,
      fearGreedTrend: fearGreed.trend,
      ethPrice,
      uniswapTVL: uniswapTVL.total,
      uniswapTVLChange24h: uniswapTVL.change24h,
      topTokenPrices,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GET /api/market-overview error:', error);
    res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
  }
});

/**
 * GET /api/history/:walletAddress
 *
 * Get completed analysis history for a wallet (from job store)
 */
app.get('/api/history/:walletAddress', (req: Request, res: Response): any => {
  try {
    const walletAddress = req.params.walletAddress as string;

    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const history = Array.from(jobStore.values())
      .filter(job => job.walletAddress.toLowerCase() === walletAddress.toLowerCase() && job.status === 'complete')
      .map(job => ({
        jobId: job.jobId,
        walletAddress: job.walletAddress,
        status: job.status,
        action: job.result?.action || null,
        expectedAPY: job.result?.expectedAPY || null,
        confidence: job.result?.confidence || null,
        negotiationRounds: job.state?.negotiationRound || 0,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ walletAddress, count: history.length, history });

  } catch (error) {
    console.error('GET /api/history error:', error);
    res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
  }
});

/**
 * GET /api/jobs
 */
app.get('/api/jobs', (_req: Request, res: Response) => {
  const jobs = Array.from(jobStore.values()).map(job => ({
    jobId: job.jobId,
    status: job.status,
    walletAddress: job.walletAddress,
    progress: calculateProgress(job.state),
    negotiationRound: job.state?.negotiationRound || 0,
    createdAt: job.createdAt,
    completedAt: job.completedAt
  }));
  res.json({ total: jobs.length, jobs });
});

/**
 * DELETE /api/jobs/:jobId
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
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeJobs: jobStore.size,
    environment: { nodeEnv: process.env.NODE_ENV || 'development', port: config.port }
  });
});

/**
 * GET /
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Autonomous DeFi Agents API v2',
    version: '2.0.0',
    description: 'AI-powered DeFi portfolio management with 10-round negotiation and Gemini LLM',
    endpoints: {
      'POST /api/analyze': 'Start portfolio analysis (accepts preferences)',
      'GET /api/status/:jobId': 'Check analysis status (includes negotiationMessages)',
      'GET /api/portfolio/:address': 'Get multi-token portfolio snapshot',
      'GET /api/market-overview': 'Live market data (Fear&Greed, ETH price, Uniswap TVL)',
      'GET /api/history/:address': 'Analysis history for a wallet',
      'GET /api/jobs': 'List all jobs',
      'DELETE /api/jobs/:jobId': 'Delete a job',
      'GET /health': 'Health check'
    }
  });
});

// ============================================================================
// JOB CLEANUP
// ============================================================================

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of jobStore.entries()) {
    if (now - job.createdAt.getTime() > config.jobRetentionTime) {
      jobStore.delete(jobId);
      cleaned++;
    }
  }

  if (cleaned > 0) console.log(`🧹 Cleaned up ${cleaned} old jobs`);
}, 600000);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log('\n' + '═'.repeat(80));
  console.log('🚀 AUTONOMOUS DEFI AGENTS API v2');
  console.log('═'.repeat(80));
  console.log(`\n📡 Server running on port ${PORT}`);
  console.log('\n📚 Endpoints:');
  console.log(`   POST   http://localhost:${PORT}/api/analyze`);
  console.log(`   GET    http://localhost:${PORT}/api/status/:jobId`);
  console.log(`   GET    http://localhost:${PORT}/api/portfolio/:address`);
  console.log(`   GET    http://localhost:${PORT}/api/market-overview`);
  console.log(`   GET    http://localhost:${PORT}/api/history/:address`);
  console.log(`   GET    http://localhost:${PORT}/health`);
  console.log('\n⚙️  Features:');
  console.log(`   ✅ Gemini LLM: ${config.googleApiKey ? 'Configured' : 'Missing'}`);
  console.log(`   ✅ NewsAPI: ${config.newsApiKey ? 'Configured' : 'Not set (news disabled)'}`);
  console.log(`   ✅ Max negotiation rounds: 10`);
  console.log('\n' + '═'.repeat(80));
});

process.on('SIGTERM', () => { console.log('\n⚠️  SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { console.log('\n⚠️  SIGINT received'); process.exit(0); });

export { app, jobStore };
