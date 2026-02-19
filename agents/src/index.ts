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

/**
 * Execute workflow in background
 * Updates job state as workflow progresses
 */
async function executeWorkflowAsync(jobId: string, walletAddress: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) {
    console.error(`Job ${jobId} not found in store`);
    return;
  }

  try {
    // Update job status
    job.status = 'analyzing';
    job.currentAgent = 'Data Collector';

    console.log(`\n🚀 Starting workflow for job ${jobId}`);
    console.log(`   Wallet: ${walletAddress}`);

    // Execute complete workflow
    const finalState = await executeWorkflow(walletAddress);

    // Update job with final results
    job.status = 'complete';
    job.currentAgent = null;
    job.state = finalState;
    job.result = finalState.finalRecommendation;
    job.completedAt = new Date();

    console.log(`✅ Workflow complete for job ${jobId}`);
    console.log(`   Recommendation: ${finalState.finalRecommendation?.action}\n`);

  } catch (error) {
    // Update job with error
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
      completedAt: null
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

    // Calculate current progress
    const progress = calculateProgress(job.state);
    const currentAgent = getCurrentAgent(job.state);

    // Return job status
    res.json({
      jobId: job.jobId,
      status: job.status,
      currentAgent: currentAgent || job.currentAgent,
      progress,
      walletAddress: job.walletAddress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      // Include full state if complete
      ...(job.status === 'complete' && { workflowState: job.state })
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

    // Import tools
    const { getEthBalance, getErc20Balance } = await import('./tools/balance-reader');
    const { getTokenPrice } = await import('./tools/price-fetcher');

    // Fetch balances and prices in parallel
    const [ethBalance, usdcBalance, ethPrice, usdcPrice] = await Promise.all([
      getEthBalance(walletAddress),
      getErc20Balance(walletAddress, config.usdcAddress),
      getTokenPrice(config.tokenSymbols.ETH),
      getTokenPrice(config.tokenSymbols.USDC)
    ]);

    // Calculate values
    const ethValue = ethBalance * ethPrice;
    const usdcValue = usdcBalance * usdcPrice;
    const totalValue = ethValue + usdcValue;

    // Return portfolio snapshot
    res.json({
      walletAddress,
      totalValue,
      holdings: {
        ETH: {
          balance: ethBalance,
          priceUSD: ethPrice,
          valueUSD: ethValue
        },
        USDC: {
          balance: usdcBalance,
          priceUSD: usdcPrice,
          valueUSD: usdcValue
        }
      },
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
