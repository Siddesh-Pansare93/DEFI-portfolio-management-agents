# Autonomous DeFi Agents Layer - Implementation Plan

## Context

Building the complete agents layer for the Autonomous DeFi Portfolio Manager. This is a hackathon MVP (6-8 hours to working demo) that uses multiple AI agents powered by Google Gemini to analyze portfolios, recommend rebalancing strategies, and execute transactions on Sepolia testnet.

**Key Architecture:**
- 4 Specialized Gemini Agents: Data Collector, Market Analyzer, Strategy Proposer, Risk Validator
- 1 Deterministic Negotiator: Nash bargaining (no LLM)
- LangGraph Orchestration: Sequential workflow with state management
- Express API Gateway: REST endpoints for frontend integration
- In-memory job tracking: No database needed for MVP

**Current State:**
- ✅ All dependencies installed (LangGraph, Gemini SDK, ethers, express, axios, zod, cors)
- ✅ RebalanceLogger contract deployed at 0x4F3DD9522c2d1B240365516a46250226e4eB7B3B
- ✅ Alchemy RPC configured, environment variables set
- ✅ All Uniswap V3 and token addresses configured for Sepolia
- ❌ No source code yet - all implementation files to be created

---

## Critical Files to Create

### Foundation (Must create first):
1. `agents/tsconfig.json` - TypeScript configuration
2. `agents/src/types/index.ts` - All type definitions
3. `agents/src/utils/config.ts` - Configuration constants
4. `agents/src/utils/retry.ts` - Retry with exponential backoff
5. `agents/src/utils/validation.ts` - Input validation utilities

### Tool Layer:
6. `agents/src/tools/balance-reader.ts` - ETH/ERC20 balance functions
7. `agents/src/tools/price-fetcher.ts` - CoinGecko price APIs
8. `agents/src/tools/pool-data.ts` - The Graph Uniswap queries
9. `agents/src/tools/analysis.ts` - Volatility, IL, APY, range calculations

### Agent Layer:
10. `agents/src/agents/data-collector.ts` - Agent 1: Portfolio data
11. `agents/src/agents/market-analyzer.ts` - Agent 2: Market trends
12. `agents/src/agents/strategy-proposer.ts` - Agent 3: Recommendations
13. `agents/src/agents/risk-validator.ts` - Agent 4: Risk assessment
14. `agents/src/agents/negotiator.ts` - Deterministic Nash negotiator

### Orchestration Layer:
15. `agents/src/workflow.ts` - LangGraph workflow definition
16. `agents/src/index.ts` - Express server + API routes

### Testing:
17. `agents/src/test-workflow.ts` - Workflow testing script

---

## Implementation Sequence

### PHASE 1: Foundation Setup (30 minutes)

**Goal:** TypeScript configuration and complete type system

#### Step 1.1: Create TypeScript Configuration
**File:** `agents/tsconfig.json`
- Target: ES2022, module: CommonJS
- Strict mode enabled
- Output: dist/, source: src/
- Include src/**, exclude node_modules

#### Step 1.2: Define All Type Interfaces
**File:** `agents/src/types/index.ts`
- Portfolio types: `TokenHolding`, `PortfolioData`
- Market types: `MarketAnalysis`, `PricePoint`
- Strategy types: `StrategyProposal`, `AddLiquidityDetails`, `SwapDetails`
- Risk types: `RiskValidation`
- Workflow types: `WorkflowState`, `JobState`, `JobStatus`
- API types: `AnalyzeResponse`, `StatusResponse`, `PortfolioResponse`
- Tool types: `PoolData`, `OptimalRangeResult`

#### Step 1.3: Configuration Constants
**File:** `agents/src/utils/config.ts`
- Load environment variables with dotenv
- Validate required vars: GOOGLE_API_KEY, SEPOLIA_RPC_URL, etc.
- Export config object with:
  - Gemini API key and model name
  - Sepolia RPC URL
  - Contract addresses (RebalanceLogger, Uniswap, tokens)
  - API endpoints (CoinGecko, The Graph)
  - Risk limits (max IL: 10%, max position: 70%)
  - Workflow settings (timeout: 2min, job retention: 30min)

#### Step 1.4: Utility Functions
**File:** `agents/src/utils/retry.ts`
- `retry<T>()` function with exponential backoff
- Retries API calls up to 3 times on failure
- Base delay multiplied by 2^attempt

**File:** `agents/src/utils/validation.ts`
- `isValidEthereumAddress()` - regex validation
- `generateUUID()` - UUID v4 generator

#### Step 1.5: Update Package Scripts
**File:** `agents/package.json` (edit scripts section)
```json
"scripts": {
  "dev": "nodemon --exec tsx src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test:workflow": "tsx src/test-workflow.ts"
}
```

**Success Criteria:**
- TypeScript compiles without errors (`tsc --noEmit`)
- All types defined and importable
- Config loads successfully with environment variables

---

### PHASE 2: Tool Functions (90 minutes)

**Goal:** Implement all blockchain and API interaction tools

#### Step 2.1: Balance Reading Tools
**File:** `agents/src/tools/balance-reader.ts`

**Functions to implement:**
- `getEthBalance(walletAddress)`: Uses ethers.js + Alchemy RPC to get ETH balance
  - Connect to provider: `new ethers.JsonRpcProvider(config.sepoliaRpcUrl)`
  - Call `provider.getBalance(walletAddress)`
  - Return formatted ETH amount (decimal)
  - Wrap with retry logic

- `getErc20Balance(walletAddress, tokenAddress)`: Get ERC20 token balance
  - Use standard ERC20 ABI: `balanceOf`, `decimals`
  - Create contract instance with ethers
  - Fetch balance and decimals in parallel
  - Format and return adjusted balance
  - Wrap with retry logic

#### Step 2.2: Price Fetching Tools
**File:** `agents/src/tools/price-fetcher.ts`

**Implement in-memory cache:**
- Map<tokenSymbol, {price, timestamp}>
- TTL: 5 minutes (config.cacheTimeout)

**Functions to implement:**
- `getTokenPrice(tokenSymbol)`: Get current USD price from CoinGecko
  - Check cache first (if recent, return cached)
  - Call CoinGecko `/simple/price` endpoint
  - Parse response, extract USD price
  - Update cache
  - Wrap with retry logic

- `getPriceHistory(tokenSymbol, days)`: Get historical prices
  - Call CoinGecko `/coins/{id}/market_chart`
  - Parse response into array of `PricePoint` objects
  - Return {timestamp, price}[] array
  - Wrap with retry logic

#### Step 2.3: Pool Data Tools
**File:** `agents/src/tools/pool-data.ts`

**Functions to implement:**
- `getUniswapPoolData(poolAddress)`: Query The Graph for pool stats
  - Construct GraphQL query for pool data
  - Fields: liquidity, token0Price, token1Price, volumeUSD, feesUSD, totalValueLockedUSD
  - POST to The Graph Uniswap V3 Sepolia subgraph
  - Calculate fee APR: (feesUSD / TVL) * 365
  - Return structured `PoolData` object
  - Wrap with retry logic

#### Step 2.4: Analysis Tools
**File:** `agents/src/tools/analysis.ts`

**Functions to implement:**
- `calculateVolatility(prices: PricePoint[])`: Calculate annualized volatility
  - Extract price values from array
  - Calculate mean price
  - Calculate standard deviation
  - Formula: (stdDev / mean) * sqrt(365) * 100
  - Return percentage

- `calculateOptimalRange(currentPrice, volatility, multiplier)`: Suggest Uniswap V3 price range
  - Calculate range width from volatility
  - Lower price: currentPrice * (1 - rangePercent)
  - Upper price: currentPrice * (1 + rangePercent)
  - Convert to Uniswap ticks: log base 1.0001
  - Round to tick spacing (60 for 0.3% fee tier)
  - Return {lowerPrice, upperPrice, lowerTick, upperTick}

- `estimateUniswapAPY(poolFeesDaily, poolLiquidity, positionSize)`: Estimate APY
  - User's share: positionSize / poolLiquidity
  - Daily earnings: share * poolFeesDaily
  - Annualize: dailyEarnings * 365
  - APY percentage: (annualEarnings / positionSize) * 100

- `calculateImpermanentLoss(priceChange)`: Calculate IL for 50/50 pool
  - Formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  - Return absolute percentage

- `checkPositionLimits(ethAmount, usdcAmount, currentBalances, ethPrice)`: Validate against risk limits
  - Check if amounts exceed current balances
  - Calculate position as % of total portfolio
  - Check if > 70% (config.riskLimits.maxSinglePosition)
  - Return {valid: boolean, violations: string[]}

**Success Criteria:**
- Each tool function runs independently
- Error handling and retries work correctly
- Cache mechanism reduces redundant API calls
- All calculations produce accurate results

---

### PHASE 3: Agent Implementations (60 minutes)

**Goal:** Implement all 4 Gemini agents + deterministic negotiator

#### Step 3.1: Data Collection Agent
**File:** `agents/src/agents/data-collector.ts`

**Implementation:**
- Initialize ChatGoogleGenerativeAI with config.googleApiKey
- Define tool schemas for Gemini function calling:
  - `getEthBalance`: {walletAddress: string}
  - `getErc20Balance`: {walletAddress: string, tokenAddress: string}
  - `getTokenPrice`: {tokenSymbol: string}
  - `getUniswapPoolData`: {poolAddress: string}

- Construct prompt template that:
  - Instructs agent to collect portfolio data
  - Lists specific steps (get balances, prices, pool data)
  - Specifies exact JSON output format
  - Includes wallet address and token addresses from config

- Implement `runDataCollector(state: WorkflowState)`:
  - Invoke Gemini with prompt and tools
  - Handle tool calls: execute actual tool functions
  - Parse final JSON response into `PortfolioData`
  - Return updated state with portfolio data

#### Step 3.2: Market Analyzer Agent
**File:** `agents/src/agents/market-analyzer.ts`

**Implementation:**
- Define tool schemas:
  - `getPriceHistory`: {tokenSymbol: string, days: number}
  - `calculateVolatility`: {prices: PricePoint[]}

- Construct prompt template that:
  - Instructs agent to analyze market trends for ETH
  - Specifies trend determination logic (bullish if >5% above 30d avg)
  - Specifies volatility classification (stable <15%, volatile >35%)
  - Requires JSON output with trend, volatility, recommendation, reasoning

- Implement `runMarketAnalyzer(state: WorkflowState)`:
  - Requires portfolio data in state
  - Invoke Gemini with market analysis prompt
  - Execute tool calls (fetch price history, calculate volatility)
  - Parse response into `MarketAnalysis`
  - Return updated state

#### Step 3.3: Strategy Proposer Agent
**File:** `agents/src/agents/strategy-proposer.ts`

**Implementation:**
- Define tool schemas:
  - `estimateUniswapAPY`: {poolFeesDaily, poolLiquidity, positionSize}
  - `calculateOptimalRange`: {currentPrice, volatility, multiplier}

- Construct prompt template that:
  - Takes portfolio + market analysis as input
  - Instructs to propose ONE action: add_liquidity, swap, or hold
  - For add_liquidity: specify amounts and optimal price range
  - For swap: specify tokens and amount
  - Requires JSON with action, details, expectedAPY, reasoning

- Implement `runStrategyProposer(state: WorkflowState)`:
  - Requires portfolio + marketAnalysis in state
  - Invoke Gemini with strategy prompt
  - Execute tool calls for APY estimation and range calculation
  - Parse response into `StrategyProposal`
  - Return updated state

#### Step 3.4: Risk Validator Agent
**File:** `agents/src/agents/risk-validator.ts`

**Implementation:**
- Define tool schemas:
  - `calculateImpermanentLoss`: {priceChange: number}
  - `checkPositionLimits`: {ethAmount, usdcAmount, currentBalances, ethPrice}

- Construct prompt template that:
  - Takes strategy proposal + portfolio + market data
  - Lists risk limits (max IL: 10%, max position: 70%)
  - Instructs to calculate risks and validate constraints
  - If violations exist, propose adjusted safer strategy
  - Requires JSON with approved, riskScore, violations, adjustedStrategy

- Implement `runRiskValidator(state: WorkflowState)`:
  - Requires strategyProposal, portfolio, marketAnalysis in state
  - Invoke Gemini with risk validation prompt
  - Execute tool calls for IL and limit checks
  - Parse response into `RiskValidation`
  - Return updated state

#### Step 3.5: Deterministic Negotiator
**File:** `agents/src/agents/negotiator.ts`

**Implementation (NO LLM):**
- Pure TypeScript function `nashNegotiator(state: WorkflowState)`
- Extract strategyProposal and riskValidation from state
- Calculate utilities:
  - returnUtility = strategyProposal.expectedAPY
  - safetyUtility = 1 - riskValidation.riskScore

- Decision rules (deterministic):
  - If approved && returnUtility > 0.10 && safetyUtility > 0.6:
    → Accept strategy as-is
  - Else if !approved || safetyUtility < 0.4:
    → Use risk-adjusted strategy (or hold if none)
  - Else:
    → Blend strategies with weighted average (60% safety)

- Create `FinalRecommendation` object:
  - action, details, expectedAPY, maxRisk
  - confidence = returnUtility * safetyUtility
  - explanation = combined reasoning from both agents

- Return updated state with finalRecommendation

**Success Criteria:**
- Each agent successfully calls Gemini API
- Tool calling works (functions executed correctly)
- JSON parsing handles responses reliably
- Negotiator produces final recommendation deterministically

---

### PHASE 4: LangGraph Workflow (45 minutes)

**Goal:** Orchestrate all agents in sequential workflow

#### Step 4.1: Workflow Definition
**File:** `agents/src/workflow.ts`

**Implementation:**

**Import dependencies:**
```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { WorkflowState } from './types';
import { runDataCollector } from './agents/data-collector';
import { runMarketAnalyzer } from './agents/market-analyzer';
import { runStrategyProposer } from './agents/strategy-proposer';
import { runRiskValidator } from './agents/risk-validator';
import { nashNegotiator } from './agents/negotiator';
```

**Define workflow graph:**
- Create `StateGraph<WorkflowState>` with channel definitions
- Add nodes for each agent:
  - 'dataCollector' → runDataCollector
  - 'marketAnalyzer' → runMarketAnalyzer
  - 'strategyProposer' → runStrategyProposer
  - 'riskValidator' → runRiskValidator
  - 'negotiator' → nashNegotiator

**Define edges (sequential flow):**
- __start__ → dataCollector
- dataCollector → marketAnalyzer
- marketAnalyzer → strategyProposer
- strategyProposer → riskValidator
- riskValidator → negotiator
- negotiator → END

**Implement execution function:**
```typescript
async function executeWorkflow(walletAddress: string): Promise<WorkflowState> {
  const workflow = createWorkflow();

  const initialState: WorkflowState = {
    walletAddress,
    portfolio: null,
    marketAnalysis: null,
    strategyProposal: null,
    riskValidation: null,
    finalRecommendation: null
  };

  // Execute with timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Workflow timeout')), config.workflowTimeout)
  );

  const workflowPromise = workflow.invoke(initialState);
  const finalState = await Promise.race([workflowPromise, timeoutPromise]);

  return finalState as WorkflowState;
}
```

**Success Criteria:**
- Workflow executes all nodes sequentially
- State accumulates data at each step
- Timeout mechanism works (2 minute limit)
- Final state contains complete recommendation

---

### PHASE 5: Express API Gateway (45 minutes)

**Goal:** REST API for frontend integration with job management

#### Step 5.1: Main Server Implementation
**File:** `agents/src/index.ts`

**Setup:**
- Import express, cors, dotenv
- Import workflow, types, validation utilities
- Create Express app with JSON middleware and CORS

**In-memory job store:**
```typescript
const jobStore = new Map<string, JobState>();
```

**Implement routes:**

**1. POST /api/analyze**
- Validate wallet address from request body
- Generate UUID job ID
- Create JobState entry in jobStore:
  - status: 'pending'
  - currentAgent: null
  - startTime: new Date()
  - empty workflow state
- Start workflow asynchronously (don't block response)
- Return {jobId, status: 'pending', message}

**2. GET /api/status/:jobId**
- Look up job in jobStore
- If not found, return 404
- Calculate progress (0-1) based on completed agents
- Return current status, agent, progress
- If complete, include finalRecommendation and workflowState
- If error, include error message

**3. GET /api/portfolio/:walletAddress**
- Validate wallet address
- Fetch ETH balance, USDC balance, prices in parallel
- Calculate total value and holdings
- Return PortfolioResponse with current snapshot

**4. POST /api/log-recommendation**
- Accept {walletAddress, action, details}
- For MVP: Return mock response (contract logging optional)
- For full implementation: Use ethers to call RebalanceLogger.logRecommendation

**Async workflow execution function:**
```typescript
async function executeWorkflowAsync(jobId: string, walletAddress: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  try {
    job.status = 'analyzing';
    job.currentAgent = 'Data Collector';

    const finalState = await executeWorkflow(walletAddress);

    job.status = 'complete';
    job.currentAgent = null;
    job.state = finalState;
    job.result = finalState.finalRecommendation;
  } catch (error) {
    job.status = 'error';
    job.error = (error as Error).message;
  }
}
```

**Background job cleanup:**
```typescript
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobStore.entries()) {
    const age = now - job.startTime.getTime();
    if (age > config.jobRetentionTime) {
      jobStore.delete(jobId);
    }
  }
}, 600000); // Clean up every 10 minutes
```

**Start server:**
```typescript
app.listen(config.port, () => {
  console.log(`🚀 Agents API running on port ${config.port}`);
  console.log('Endpoints:');
  console.log(`  POST   /api/analyze`);
  console.log(`  GET    /api/status/:jobId`);
  console.log(`  GET    /api/portfolio/:address`);
});
```

**Success Criteria:**
- Server starts without errors
- All endpoints respond correctly
- Job tracking works in memory
- Concurrent requests handled properly
- CORS allows frontend requests

---

### PHASE 6: Testing & Validation (30 minutes)

**Goal:** Verify end-to-end workflow functionality

#### Step 6.1: Create Test Script
**File:** `agents/src/test-workflow.ts`

**Implementation:**
```typescript
import { executeWorkflow } from './workflow';

async function testWorkflow() {
  console.log('🧪 Testing Agent Workflow\n');

  // Use a real Sepolia address or test wallet
  const testAddress = '0x1234567890123456789012345678901234567890';

  console.log(`Testing with address: ${testAddress}\n`);

  try {
    const result = await executeWorkflow(testAddress);

    console.log('✅ Workflow completed!\n');
    console.log('Portfolio:', result.portfolio);
    console.log('Market Analysis:', result.marketAnalysis);
    console.log('Strategy:', result.strategyProposal);
    console.log('Risk:', result.riskValidation);
    console.log('Final Recommendation:', result.finalRecommendation);

    if (result.finalRecommendation) {
      console.log(`\n📊 Action: ${result.finalRecommendation.action}`);
      console.log(`Expected APY: ${(result.finalRecommendation.expectedAPY * 100).toFixed(2)}%`);
      console.log(`Max Risk: ${(result.finalRecommendation.maxRisk * 100).toFixed(2)}%`);
      console.log(`Confidence: ${(result.finalRecommendation.confidence * 100).toFixed(0)}%`);
    }
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    process.exit(1);
  }
}

testWorkflow();
```

#### Step 6.2: Manual Testing Checklist
- [ ] Test workflow with real Sepolia wallet address
- [ ] Verify all agents execute in sequence
- [ ] Check that portfolio data is fetched correctly
- [ ] Validate market analysis produces reasonable trends
- [ ] Confirm strategy proposal matches market conditions
- [ ] Verify risk validation catches unsafe strategies
- [ ] Test API endpoints with curl/Postman:
  - POST /api/analyze returns job ID
  - GET /api/status shows progress
  - GET /api/portfolio returns balances
- [ ] Test error scenarios:
  - Invalid wallet address
  - Gemini API failure
  - Workflow timeout

**Success Criteria:**
- Test workflow completes end-to-end
- All agents produce valid JSON outputs
- Final recommendation is generated
- API responds within expected time (<2 min)
- Error handling works gracefully

---

## Verification & Testing Strategy

### Unit Testing
- Test each tool function independently with mock data
- Test deterministic calculations (volatility, IL, APY)
- Test validation functions

### Integration Testing
- Test workflow with mock Gemini responses
- Verify state flows through all agents
- Test error propagation

### End-to-End Testing
- Use real Sepolia testnet data
- Execute full analysis workflow
- Verify recommendation quality

### Performance Testing
- Measure agent execution time (target <60 sec)
- Monitor Gemini API latency
- Check memory usage with job store

---

## Environment Setup Requirements

**Before starting implementation:**

1. **Install Google Gemini API Key:**
   - Get key from Google AI Studio
   - Update `.env`: `GOOGLE_API_KEY=your-actual-key`

2. **Verify Network Access:**
   - Alchemy RPC URL accessible
   - CoinGecko API accessible
   - The Graph endpoint accessible

3. **Test Fund Wallet (for testing):**
   - Get Sepolia ETH from faucet
   - Get test USDC from Sepolia faucet

---

## Execution Order Summary

**Day 1 (4 hours):**
1. Foundation Setup (30 min) - Types, config, utilities
2. Tool Functions (90 min) - All blockchain/API tools
3. Start Agent Implementation (60 min) - Data Collector + Market Analyzer

**Day 2 (4 hours):**
4. Finish Agents (60 min) - Strategy + Risk + Negotiator
5. LangGraph Workflow (45 min) - Orchestration layer
6. Express API (45 min) - REST endpoints + job management
7. Testing & Validation (30 min) - End-to-end verification

**Total: 6-8 hours to working demo**

---

## Post-Implementation Enhancements (Future)

**Not in MVP scope, but future improvements:**
- Contract logging implementation (RebalanceLogger integration)
- WebSocket for real-time updates (replace polling)
- Frontend development (React + wagmi)
- Transaction building and execution
- Database persistence (PostgreSQL)
- Monitoring and observability
- Production deployment

---

## Key Success Metrics

✅ **Agents layer complete when:**
- All 4 Gemini agents execute successfully
- Deterministic negotiator produces final recommendations
- LangGraph workflow orchestrates agents sequentially
- Express API provides REST endpoints
- End-to-end test workflow completes in <2 minutes
- Portfolio analysis returns actionable recommendations
- Error handling works gracefully
- Code is well-structured and documented

---

## Critical Dependencies

**Must have before starting:**
- Google Gemini API key (real, not placeholder)
- Alchemy Sepolia RPC access
- CoinGecko API access (no key needed)
- The Graph access (no key needed)

**Nice to have for full testing:**
- Sepolia test wallet with ETH + USDC
- RebalanceLogger contract ABI (for future logging)
