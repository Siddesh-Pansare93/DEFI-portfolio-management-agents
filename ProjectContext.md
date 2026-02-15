# 🎯 Autonomous DeFi Portfolio Manager - Complete Technical Specification

**Version:** 1.0  
**Date:** February 15, 2026  
**Project Type:** Hackathon MVP - AI-Powered DeFi Portfolio Management  
**Timeline:** 6-8 hours to working demo  
**Tech Stack:** React + Express + LangGraph + Gemini + Solidity + Sepolia  

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Data Model & Storage Strategy](#3-data-model--storage-strategy)
4. [Agent System Design](#4-agent-system-design)
5. [Data Flow Documentation](#5-data-flow-documentation)
6. [API Specifications](#6-api-specifications)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Smart Contract Integration](#8-smart-contract-integration)
9. [External Dependencies](#9-external-dependencies)
10. [Development Roadmap](#10-development-roadmap)

---

## 1. Project Overview

### 1.1 What We Are Building

We are building an autonomous DeFi portfolio manager that uses multiple AI agents powered by Google Gemini to analyze user portfolios, recommend rebalancing strategies, and execute transactions on the Sepolia testnet. The system acts as a personal financial advisor for DeFi investments, abstracting away complexity while maintaining full user control through a non-custodial architecture.

### 1.2 Core Value Proposition

Traditional DeFi requires users to manually monitor prices, calculate optimal liquidity ranges, assess impermanent loss risk, and execute complex transactions across multiple protocols. Our system automates this entire workflow through AI agents that reason about market conditions, portfolio allocation, and risk management in natural language, then present actionable recommendations that users can review and execute with a single click.

### 1.3 Key Features

The system provides real-time portfolio analysis by fetching the user's current token holdings and their dollar values. It performs market trend analysis by examining recent price movements and volatility patterns. The strategy recommendation engine proposes specific actions such as adding liquidity to Uniswap pools, swapping tokens, or maintaining current positions. A risk validation layer ensures all recommendations stay within safe parameters for impermanent loss, volatility exposure, and position concentration. Every recommendation is logged on-chain for transparency, and all transactions require explicit user approval through MetaMask, maintaining a fully non-custodial model.

### 1.4 Technical Constraints

This is a hackathon MVP operating exclusively on Sepolia testnet. We use real DeFi protocols including Uniswap V3 and their deployed Sepolia instances. The system handles test tokens only with no real financial value. We prioritize working functionality over production-grade security, aiming for a compelling demonstration rather than mainnet deployment. The architecture is designed to be understandable and debuggable within a short timeframe, using familiar tools and avoiding unnecessary complexity.

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Frontend (Vite + TypeScript)                      │  │
│  │  • Wallet Connection (wagmi + viem)                      │  │
│  │  • Portfolio Dashboard                                   │  │
│  │  • Agent Analysis Display                                │  │
│  │  • Transaction Approval Flow                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS REST API
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Server (Node.js + TypeScript)                   │  │
│  │  • POST /api/analyze - Trigger agent workflow            │  │
│  │  • GET /api/status/:jobId - Poll workflow progress       │  │
│  │  • GET /api/portfolio/:address - Fetch user portfolio    │  │
│  │  • POST /api/log-recommendation - Log to contract        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ In-Memory State
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LangGraph Workflow Engine                               │  │
│  │  • State management (in-memory Map)                      │  │
│  │  • Sequential agent execution                            │  │
│  │  • Tool calling coordination                             │  │
│  │  • Error handling & retries                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Four Specialized Agents (Google Gemini 1.5 Pro):              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ Data       │ │ Market     │ │ Strategy   │ │ Risk       │  │
│  │ Collector  │ │ Analyzer   │ │ Proposer   │ │ Validator  │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  Plus Deterministic Negotiator (No LLM):                        │
│  ┌────────────┐                                                 │
│  │ Nash       │                                                 │
│  │ Negotiator │                                                 │
│  └────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↕                    ↕                    ↕
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ EXTERNAL APIS    │ │ BLOCKCHAIN RPC   │ │ SMART CONTRACTS  │
│                  │ │                  │ │                  │
│ CoinGecko        │ │ Alchemy Sepolia  │ │ RebalanceLogger  │
│ (Prices)         │ │ (Balances)       │ │ 0x4F3DD9...B3B   │
│                  │ │                  │ │                  │
│ The Graph        │ │ Uniswap V3       │ │ Uniswap Router   │
│ (Pool Data)      │ │ (Swaps/LP)       │ │ 0x3fC91A...FAD   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 2.2 Component Responsibilities

**Frontend React App:** This component handles all user interactions. It connects to the user's MetaMask wallet using wagmi hooks and displays their current portfolio by reading blockchain balances. When a user requests analysis, it calls the backend API and polls for results. It displays agent thinking processes in real-time, showing which agent is currently working and what data it has gathered. When recommendations are ready, it presents them in clear language with expected returns and risks. Users can approve recommendations, which triggers the transaction building process. The frontend then sends unsigned transactions to MetaMask for user signature and broadcasts signed transactions to Sepolia. Throughout this process, it provides real-time status updates on transaction confirmation.

**Express API Gateway:** This layer serves as the bridge between the frontend and the agent system. It receives requests from the frontend and validates wallet addresses to ensure they are properly formatted Ethereum addresses. When an analysis is requested, it generates a unique job identifier and starts the agent workflow asynchronously, immediately returning the job ID to the frontend so the user sees instant feedback. It maintains an in-memory map of job statuses that the frontend can poll to track progress. When agents complete their work, the API formats the recommendations into a structure the frontend expects, including unsigned transaction data. It also provides helper endpoints to fetch current portfolio data and log recommendations to the smart contract. The API handles CORS to allow the frontend to make requests and includes basic error handling to gracefully manage failures.

**LangGraph Workflow Engine:** This is the orchestration layer that manages the multi-agent pipeline. It maintains state as a JavaScript object that flows through each agent, accumulating data at each step. The engine invokes agents sequentially, passing the current state to each one and receiving updated state back. It handles tool calling by intercepting when Gemini requests to use a tool, executing the tool function, and returning results to Gemini. The engine persists state in memory using a Map keyed by job ID, allowing the API to check status without blocking. It implements basic retry logic if an agent call fails due to network issues or API limits. The workflow is defined as a directed graph where each node is an agent and edges define the execution order.

**Agent System (Gemini-Powered):** Four specialized agents work together to analyze portfolios. The Data Collector agent uses tools to fetch the user's current ETH and USDC balances from Sepolia, gets current prices for these tokens from CoinGecko, and retrieves Uniswap V3 pool statistics like liquidity depth and current fee rates. It structures all this data into a portfolio object. The Market Analyzer agent examines recent price history to determine if ETH is trending upward or downward, calculates volatility metrics to assess market stability, and interprets this data to provide a market sentiment assessment. The Strategy Proposer agent takes the portfolio and market data to recommend specific actions such as adding liquidity to a Uniswap pool with a suggested price range, swapping a portion of holdings between tokens, or holding the current allocation if no changes are beneficial. It estimates expected annual percentage yields and explains its reasoning. The Risk Validator agent evaluates the proposed strategy by calculating potential impermanent loss, checking that no single position exceeds safety thresholds, and ensuring the strategy aligns with conservative risk parameters. If the strategy is too risky, it proposes a safer adjusted version.

**Deterministic Negotiator:** This component implements a Nash bargaining solution without using an LLM. It receives the strategy proposal with its expected return metric and the risk validation with its safety score. It applies a simple decision algorithm that accepts the strategy if both return and safety scores are above thresholds, uses the risk-adjusted version if the original is too risky, or blends the two proposals with a weighted average if they partially conflict. This ensures the final recommendation balances return optimization with risk management through a transparent mathematical formula rather than opaque AI reasoning.

### 2.3 Technology Choices Explained

We chose React with TypeScript for the frontend because it provides excellent developer experience with type safety and rich ecosystem. The wagmi and viem libraries offer modern, type-safe Ethereum interactions that are more reliable than older alternatives like web3.js. For the backend, Express is lightweight and familiar, allowing rapid development. LangGraph provides a clean abstraction for multi-agent workflows with built-in state management. We selected Google Gemini over other LLMs because it offers generous free tier limits suitable for a hackathon, supports function calling which is essential for tool use, and has a large context window that can handle substantial data. Ethers v6 gives us robust Web3 capabilities for reading blockchain data and building transactions. We use in-memory storage rather than a database because for a hackathon MVP we do not need persistence between server restarts, which simplifies deployment and reduces dependencies. All state can be reconstructed from blockchain data if needed. For the smart contract, we use Solidity on Sepolia because it is the standard testnet for Ethereum development with readily available faucets and familiar tooling.

---

## 3. Data Model & Storage Strategy

### 3.1 User Data Storage Decision

For this hackathon MVP, we are implementing a **stateless, wallet-centric architecture** with no traditional user database. This decision is based on several considerations specific to a DeFi application and hackathon constraints.

#### Why No User Database

User identity in Web3 is fundamentally tied to wallet addresses, not usernames or email accounts. When a user connects their MetaMask wallet, the wallet address serves as their unique identifier. This address is cryptographically secure and cannot be spoofed. For our use case, we do not need to store user preferences, settings, or historical data persistently because each analysis starts fresh based on current blockchain state. The user's complete financial history is already stored immutably on the blockchain through their transaction history and smart contract interactions. Our RebalanceLogger contract maintains an on-chain record of all recommendations made for each address, providing transparency without requiring a database. By avoiding a database, we eliminate attack vectors related to data breaches, reduce infrastructure complexity, and avoid regulations around storing financial data. For a hackathon demo, this architecture is ideal because it requires no database setup, migrations, or backup strategies.

#### What Data We Actually Need

At runtime, the system needs to know the wallet address of the requesting user, which comes directly from the MetaMask connection. We need to track in-flight analysis jobs, which we store temporarily in memory using a Map structure with job IDs as keys. Each job entry contains the wallet address, current status (pending, analyzing, complete, error), which agent is currently executing, the accumulated state object flowing through agents, the final recommendation if complete, and a timestamp for potential cleanup of old jobs. This data lives only as long as the server process runs. When the user's browser refreshes, they reconnect their wallet and can trigger a new analysis. We do not persist past recommendations server-side because they are logged on-chain via the RebalanceLogger contract.

#### On-Chain Data as Source of Truth

The blockchain itself serves as our persistent storage layer. Every recommendation our system generates is logged to the RebalanceLogger smart contract at address 0x4F3DD9522c2d1B240365516a46250226e4eB7B3B on Sepolia. This contract maps each wallet address to an array of Recommendation structs containing the action type, full details as JSON, timestamp, and execution status. Users can query their entire recommendation history by calling contract read methods. The frontend can display this history by reading from the contract, requiring no backend database queries. If we wanted to show "Your past 10 recommendations" in the UI, we would call the contract's getAllRecommendations function filtered by the connected wallet address. This approach provides transparency because anyone can verify recommendations on Etherscan, ensures data persistence independent of our backend, and aligns with Web3 principles of decentralization.

### 3.2 In-Memory State Management

Our backend maintains a single JavaScript Map for tracking active jobs:

```typescript
// In-memory job store
const jobStore = new Map<string, JobState>();

interface JobState {
  jobId: string;
  walletAddress: string;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  currentAgent: string | null;
  startTime: Date;
  state: WorkflowState;
  result: FinalRecommendation | null;
  error: string | null;
}

interface WorkflowState {
  walletAddress: string;
  portfolio: PortfolioData | null;
  marketAnalysis: MarketAnalysis | null;
  strategyProposal: StrategyProposal | null;
  riskValidation: RiskValidation | null;
  finalRecommendation: FinalRecommendation | null;
}
```

When a user requests analysis, we generate a UUID job ID, create a new JobState entry in the map, start the LangGraph workflow asynchronously, and return the job ID to the frontend. The workflow updates the JobState as it progresses through agents. The frontend polls the status endpoint with the job ID, and we return the current state from the map. After successful completion, we keep the job in memory for thirty minutes to allow the user to review and execute the recommendation. A background cleanup task removes jobs older than thirty minutes to prevent memory leaks. If the server restarts, all in-flight jobs are lost, but this is acceptable for a demo since users can simply click analyze again.

### 3.3 Data That Flows Through Agents

The workflow state object grows as it passes through each agent. Initially it contains only the wallet address. After the Data Collector agent runs, it includes a portfolio object with current holdings for each token including balance, dollar value, and price, plus the total portfolio value in USD. After the Market Analyzer agent runs, it adds a market analysis object describing price trends, volatility metrics, and sentiment interpretation. After the Strategy Proposer agent runs, it includes a strategy proposal detailing the recommended action, specific parameters like amounts and price ranges, expected APY, and reasoning. After the Risk Validator agent runs, it adds risk validation containing approval status, calculated risk metrics like impermanent loss, flagged violations if any, and possibly an adjusted safer proposal. Finally, the Negotiator adds the final recommendation that the frontend will display, which is the negotiated decision between strategy and risk.

This state object is passed by reference through the LangGraph workflow, meaning each agent can read all previous agents' outputs and append its own. The final state contains the complete reasoning chain from data collection through final recommendation, providing full transparency into how the decision was made.

### 3.4 Frontend Local State

The React frontend uses local component state to manage the user experience. It stores the connected wallet address from wagmi hooks. When analysis is triggered, it stores the job ID returned by the API and the current polling status. It maintains the latest recommendation data fetched from the API including the full workflow state for displaying agent progress. If the user approves the recommendation, it stores unsigned transaction data that will be sent to MetaMask. After transaction submission, it stores the transaction hash and confirmation status. This data exists only in the browser session and is lost on refresh. The wallet connection persists through wagmi's internal state management, so users only need to reconnect if they explicitly disconnect.

### 3.5 Future Database Considerations

If this project were to evolve beyond a hackathon MVP toward production use, we would introduce a database for specific purposes. We would store user preferences like risk tolerance settings, preferred notification channels, and UI customization. We would cache frequently accessed data like token prices and pool statistics to reduce external API calls. We would maintain analytics data tracking system usage, recommendation acceptance rates, and performance metrics. We would implement rate limiting data to prevent abuse by tracking requests per wallet address. However, we would still NOT store private keys or user credentials. Wallet addresses would remain the primary identifier. Historical recommendations would still be retrieved from the blockchain rather than duplicating that data in a database. The core principle of non-custodial architecture would be maintained, with the database only enhancing user experience rather than being critical to functionality.

For this hackathon, the simpler stateless architecture lets us focus on the innovative AI agent system rather than database administration.

---

## 4. Agent System Design

### 4.1 Agent Architecture Philosophy

Our multi-agent system is inspired by how human financial advisors work in teams. A junior analyst gathers data, a market researcher provides context, a strategist proposes actions, and a risk manager reviews for safety. By separating these concerns into distinct agents, each with a focused responsibility, we make the system more modular, debuggable, and explainable. Each agent uses Google Gemini with carefully crafted prompts that define its role, available tools, and output format. Agents do not communicate directly with each other; instead, they read and write to a shared state object managed by the LangGraph workflow engine.

### 4.2 Agent One: Data Collection Agent

**Purpose:** This agent is responsible for gathering all current factual data about the user's portfolio and the relevant DeFi protocols.

**Gemini Prompt:**
```
You are a DeFi data specialist. Your job is to collect current portfolio information for a user.

Given wallet address: {walletAddress}

Use the following tools to gather data:
1. getEthBalance - Returns the ETH balance for an address
2. getErc20Balance - Returns the balance of an ERC20 token (USDC)
3. getTokenPrice - Returns current USD price for a token
4. getUniswapPoolData - Returns statistics about a Uniswap V3 pool

Steps:
1. Get the user's ETH balance
2. Get the user's USDC balance
3. Get current ETH/USD price
4. Get current USDC/USD price (should be ~$1)
5. Get Uniswap V3 ETH-USDC pool data (liquidity, fees, volume)

Calculate:
- Total portfolio value in USD
- Current allocation percentage (ETH vs USDC)

Return your findings as a structured JSON object with this exact format:
{
  "holdings": {
    "ETH": {"balance": number, "priceUSD": number, "valueUSD": number},
    "USDC": {"balance": number, "priceUSD": number, "valueUSD": number}
  },
  "totalValueUSD": number,
  "allocationPercent": {"ETH": number, "USDC": number},
  "uniswapPool": {
    "address": string,
    "liquidity": number,
    "volume24h": number,
    "feeAPR": number
  }
}

Do not include any explanation, only return the JSON object.
```

**Available Tools:**

The getEthBalance tool takes a wallet address as input and uses ethers.js to call the Alchemy RPC endpoint with eth_getBalance, returning the balance in ETH as a decimal number.

The getErc20Balance tool takes a wallet address and token contract address, uses ethers.js to create a contract instance with the standard ERC20 ABI, calls the balanceOf method, and returns the balance adjusted for token decimals.

The getTokenPrice tool takes a token symbol like "ethereum" or "usd-coin", makes an HTTP request to CoinGecko's /simple/price endpoint, and returns the current USD price.

The getUniswapPoolData tool takes a pool address, queries The Graph's Uniswap V3 subgraph for the Sepolia network, and returns the pool's liquidity in USD, 24-hour volume, and calculated fee APR based on fees collected.

**Output Structure:**

The agent produces a portfolio object that includes precise balance numbers, current prices, calculated USD values, allocation percentages, and relevant pool statistics. This becomes the foundation for all subsequent analysis.

**Error Handling:**

If the wallet has zero balance in both tokens, the agent returns an error state indicating no portfolio to analyze. If external APIs fail, the agent retries up to three times with exponential backoff before failing the job. If a tool returns unexpected data formats, the agent's JSON schema validation will catch it and request re-execution.

### 4.3 Agent Two: Market Analyzer Agent

**Purpose:** This agent interprets market conditions to provide context for strategic decisions.

**Gemini Prompt:**
```
You are a DeFi market analyst. Analyze recent market trends to inform portfolio strategy.

Current portfolio data: {portfolioData}

Use these tools:
1. getPriceHistory - Get historical prices for a token
2. calculateVolatility - Calculate price volatility over a period

Steps:
1. Get 30-day price history for ETH
2. Calculate ETH volatility
3. Determine trend (bullish, bearish, neutral) based on price movement
4. Assess market conditions (volatile, stable, uncertain)

Provide analysis in this JSON format:
{
  "ethTrend": "bullish" | "bearish" | "neutral",
  "ethPriceChange30d": number,
  "volatility": number,
  "marketCondition": "stable" | "volatile" | "uncertain",
  "recommendation": "increase_eth" | "decrease_eth" | "maintain",
  "reasoning": "Brief explanation of your analysis (2-3 sentences)"
}

Be objective and data-driven. Focus on facts from the price data.
```

**Available Tools:**

The getPriceHistory tool takes a token symbol and number of days, queries CoinGecko's /coins/{id}/market_chart endpoint, and returns an array of price points with timestamps.

The calculateVolatility tool takes an array of prices, computes the standard deviation, and returns the annualized volatility percentage using the formula: volatility = (stdDev / mean) * sqrt(365) * 100.

**Output Structure:**

The agent produces a market analysis object describing the current trend direction, magnitude of recent price changes, volatility level, overall market assessment, a preliminary recommendation, and clear reasoning explaining how it reached these conclusions.

**Analysis Logic:**

The agent examines the 30-day price history. If the current price is more than five percent higher than the 30-day average, it labels the trend as bullish. If more than five percent lower, it labels it bearish. Otherwise, it is neutral. Volatility above thirty-five percent annualized is considered volatile, while below fifteen percent is stable. The agent uses this data to form a recommendation. For example, in a bullish, stable market, it might suggest increasing ETH exposure. In a bearish, volatile market, it might suggest reducing ETH allocation.

### 4.4 Agent Three: Strategy Proposer Agent

**Purpose:** This agent generates specific, actionable portfolio strategies based on current data and market analysis.

**Gemini Prompt:**
```
You are a DeFi portfolio strategist. Propose concrete actions to optimize the portfolio.

Input data:
- Portfolio: {portfolioData}
- Market Analysis: {marketAnalysis}

Use these tools:
1. estimateUniswapAPY - Estimate yield from providing liquidity
2. calculateOptimalRange - Suggest price range for LP position
3. estimateSwapImpact - Calculate slippage for a token swap

Your task:
Consider the user's current holdings and market conditions. Propose ONE of these actions:
- add_liquidity: Add funds to a Uniswap V3 pool
- swap: Exchange one token for another
- hold: Keep current allocation

For add_liquidity, specify amounts and optimal price range.
For swap, specify which token to sell and how much.

Return this JSON format:
{
  "action": "add_liquidity" | "swap" | "hold",
  "details": {
    // For add_liquidity:
    "pool": "ETH-USDC",
    "ethAmount": number,
    "usdcAmount": number,
    "priceRangeLower": number,
    "priceRangeUpper": number,
    // For swap:
    "fromToken": string,
    "toToken": string,
    "amount": number
  },
  "expectedAPY": number,
  "expectedReturn1Year": number,
  "reasoning": "Detailed explanation (3-5 sentences)"
}

Optimize for yield while considering market conditions. Be specific with numbers.
```

**Available Tools:**

The estimateUniswapAPY tool takes a pool address and amount to provide, queries recent fee earnings from The Graph, and projects annualized yield based on current fee generation and liquidity depth.

The calculateOptimalRange tool takes current price and volatility, then suggests a price range using the formula: center price ± (k * volatility * price), where k is a constant based on how tight we want the range. A tighter range earns more fees but risks going out of range.

The estimateSwapImpact tool takes token pair, amount, and direction, simulates the swap against current Uniswap pool state using the x * y = k formula, and returns expected price impact and output amount.

**Output Structure:**

The agent produces a strategy proposal with a clear action type, specific details including exact amounts and parameters, estimated financial outcomes, and thorough reasoning explaining why this strategy makes sense given the inputs.

**Strategy Logic:**

If the portfolio is heavily weighted toward one asset and the market analysis suggests diversification, the agent proposes a swap. If the portfolio is reasonably balanced and the market is showing opportunity for yield generation, it proposes adding liquidity. If the market is highly uncertain or volatile, it may propose holding the current position to avoid unnecessary risk. The agent always grounds its recommendation in the specific numbers it has gathered, not generic advice.

### 4.5 Agent Four: Risk Validator Agent

**Purpose:** This agent acts as a safety check, ensuring proposed strategies do not expose the user to excessive risk.

**Gemini Prompt:**
```
You are a DeFi risk manager. Evaluate the proposed strategy for safety.

Proposed strategy: {strategyProposal}
Current portfolio: {portfolioData}
Market conditions: {marketAnalysis}

Use these tools:
1. calculateImpermanentLoss - Estimate max IL for an LP position
2. checkPositionLimits - Verify strategy respects safe limits

Risk limits:
- Maximum impermanent loss: 10%
- Maximum single position: 70% of portfolio
- Minimum diversification: Hold at least 2 assets
- Maximum leverage: None (we don't use leverage in this MVP)

Evaluate:
1. Calculate potential impermanent loss if adding liquidity
2. Check if strategy violates any limits
3. If unsafe, propose adjustments to make it safer

Return this JSON:
{
  "approved": boolean,
  "riskScore": number (0-1, where 0 is safest),
  "estimatedMaxIL": number,
  "violations": string[],
  "adjustedStrategy": {
    // Only if approved is false
    // Return a safer version of the strategy
  } | null,
  "reasoning": "Explanation of risk assessment"
}
```

**Available Tools:**

The calculateImpermanentLoss tool takes token amounts, price range, and current volatility, then uses the IL formula to estimate maximum loss if prices move to range boundaries. For a 50/50 pool, IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1.

The checkPositionLimits tool takes the proposed allocation, compares against predefined safety rules, and returns a boolean for each check plus an array of any violations found.

**Output Structure:**

The agent produces a risk validation object with a binary approval decision, a numeric risk score for granularity, specific risk metrics like IL, a list of any violated constraints, potentially an adjusted safer strategy, and clear reasoning about the risk assessment.

**Risk Logic:**

The agent calculates worst-case scenarios. For liquidity provision, it considers what happens if ETH doubles or halves in price, computing the resulting impermanent loss. If IL exceeds ten percent, the strategy is flagged as risky. The agent checks if the proposed position would put more than seventy percent of the portfolio into a single asset or position. If so, it proposes reducing the amount. If volatility is extremely high (over fifty percent), the agent may suggest widening the price range or reducing exposure. The goal is to prevent catastrophic losses while still allowing reasonable yield opportunities.

### 4.6 Deterministic Negotiator Component

**Purpose:** This component combines the strategy proposal and risk validation into a final recommendation using a transparent algorithm, not AI reasoning.

**Implementation:**

This is a pure TypeScript function, not an agent with an LLM. It receives the strategy proposal with its expected APY and the risk validation with its risk score and approval status. It applies Nash bargaining game theory, which seeks a solution that maximizes the product of utilities for both "players"—in this case, the return-seeking strategy and the safety-seeking risk manager.

```typescript
function nashNegotiator(
  strategyProposal: StrategyProposal,
  riskValidation: RiskValidation
): FinalRecommendation {
  const returnUtility = strategyProposal.expectedAPY;
  const safetyUtility = 1 - riskValidation.riskScore;
  
  // Decision rules
  if (riskValidation.approved && returnUtility > 0.10 && safetyUtility > 0.6) {
    // Both agents happy: accept strategy as-is
    return {
      action: strategyProposal.action,
      details: strategyProposal.details,
      expectedAPY: strategyProposal.expectedAPY,
      maxRisk: riskValidation.estimatedMaxIL,
      confidence: returnUtility * safetyUtility,
      explanation: combineReasoning(strategyProposal, riskValidation)
    };
  } else if (!riskValidation.approved || safetyUtility < 0.4) {
    // Too risky: use risk-adjusted version
    return {
      action: riskValidation.adjustedStrategy.action,
      details: riskValidation.adjustedStrategy.details,
      expectedAPY: riskValidation.adjustedStrategy.expectedAPY,
      maxRisk: riskValidation.adjustedStrategy.estimatedMaxIL,
      confidence: safetyUtility,
      explanation: "Adopted safer version due to risk concerns: " + riskValidation.reasoning
    };
  } else {
    // Moderate conflict: blend with 60/40 weighting favoring safety
    return blendStrategies(strategyProposal, riskValidation.adjustedStrategy, 0.4);
  }
}
```

The blendStrategies function creates a compromise by taking weighted averages of amounts. For example, if the strategy proposes 0.5 ETH liquidity and risk suggests 0.3 ETH, the blend might be 0.4 ETH. Price ranges are widened to satisfy safety requirements. The output is a single cohesive recommendation that the frontend will present to the user.

**Why Not Use an LLM Here:**

Using a deterministic algorithm for the final decision provides transparency and predictability. Users and auditors can understand exactly how the system reached its conclusion without needing to interpret opaque AI reasoning. It also eliminates the risk of the LLM making an illogical choice or being influenced by prompt injection. The math behind Nash bargaining is well-studied and reliable. This component adds trust to the system because its behavior is fully deterministic and testable.

### 4.7 Agent Communication Flow

The agents do not send messages to each other. Instead, the LangGraph workflow engine manages state transitions. When Agent One completes, it returns its output to the engine. The engine updates the workflow state object by adding the portfolio data. It then invokes Agent Two, passing it the updated state that now includes Agent One's output. Agent Two reads the portfolio data from state, performs its analysis, and returns market analysis. The engine adds this to state and invokes Agent Three. This continues sequentially until all agents have run. The final state object contains the complete chain of reasoning from data collection through risk validation. The engine then calls the negotiator function with relevant parts of the state, and the negotiator returns the final recommendation, which is added to state. This state object is what the API returns to the frontend.

This sequential, state-based architecture is simpler to understand and debug than having agents communicate through a shared message bus or prompt each other directly. It also makes it easy to add or remove agents by modifying the workflow graph without changing agent code.

---

## 5. Data Flow Documentation

### 5.1 Complete User Journey Flow

Let me walk through what happens when a user interacts with the system, from the moment they open the app to when a transaction confirms on Sepolia.

**Step 1: User Arrives at Application**

The user opens the frontend URL in their browser. The React app loads and immediately detects whether MetaMask is installed. If MetaMask is not present, the app displays a message directing the user to install it. If MetaMask is installed, the app checks if it is already connected to this site from a previous session. If so, wagmi automatically reconnects and fetches the wallet address. If not connected, the app displays a "Connect Wallet" button prominently in the center of the screen.

**Step 2: Wallet Connection**

When the user clicks "Connect Wallet," the frontend calls wagmi's connect function. This triggers a MetaMask popup asking the user to select an account and approve the connection. Once approved, wagmi stores the connection in browser local storage for future sessions. The frontend receives the wallet address and immediately switches to showing the dashboard view. At the top of the dashboard, the user sees their truncated wallet address and a network indicator showing "Sepolia Testnet." If the user is on the wrong network, the app displays a prominent warning asking them to switch to Sepolia in MetaMask.

**Step 3: Portfolio Loading**

With the wallet connected, the frontend begins fetching the user's current portfolio. It makes simultaneous calls using viem's publicClient to read ETH balance via getBalance and USDC balance via readContract with the ERC20 balanceOf function. These are read-only calls that do not require gas or signatures. The results typically return within one to two seconds. The frontend then calls CoinGecko to get current USD prices for ETH and USDC. With balances and prices, it calculates total portfolio value and displays a portfolio card showing each token's balance and USD value, plus the total. The UI uses skeleton loaders while data is fetching to provide visual feedback.

**Step 4: User Triggers Analysis**

The user sees an "Analyze Portfolio" button below the portfolio card. They click it. The frontend immediately shows a loading state with an animated spinner and text saying "Starting AI analysis..." It then makes an HTTP POST request to the backend at /api/analyze with a JSON body containing their wallet address. This request goes to the Express server running on localhost:3001 during development or a deployed URL in production.

**Step 5: Backend Receives Request**

The Express server receives the POST to /api/analyze. The route handler validates that the wallet address is a valid Ethereum address using a regex check. It generates a unique UUID job ID using the crypto library. It creates a new JobState object in the in-memory map with status set to "pending" and the current timestamp. It then calls a function to start the LangGraph workflow asynchronously, passing the job ID and wallet address. This function immediately returns, so the API can respond to the frontend without waiting for agents to complete. The server responds with HTTP 200 and JSON containing the job ID. The frontend receives this job ID within milliseconds.

**Step 6: Frontend Begins Polling**

Upon receiving the job ID, the frontend starts a polling loop. Every two seconds, it makes an HTTP GET request to /api/status/{jobId}. The backend looks up this job ID in the map and returns the current JobState, which includes status, current agent name, and partial state data. The frontend uses this to update the UI, showing which agent is working. For example, it might display "Data Collection Agent is fetching your balances..." with a spinner. As each agent completes, the UI updates to show a checkmark next to that agent and moves to the next one.

**Step 7: Agent Workflow Execution (Backend)**

Meanwhile, the LangGraph workflow is executing in the background. The workflow starts with an empty state object containing only the wallet address. It invokes the Data Collection Agent by calling Gemini's API with the agent's prompt and available tools. Gemini decides which tools to call. It might first call getEthBalance with the wallet address. The workflow engine intercepts this tool call, executes the getEthBalance function which makes an RPC call to Alchemy, and returns the result to Gemini. Gemini processes this result and decides to call the next tool, getErc20Balance for USDC. This continues until Gemini has gathered all needed data. Gemini then formats the data as JSON and returns it. The workflow engine parses this JSON, validates it against the expected schema, and adds the portfolio object to the workflow state. It updates the JobState in the map to show "Data Collection Agent" completed and "Market Analyzer Agent" is now running.

The workflow then invokes the Market Analyzer Agent, passing it the state which now includes the portfolio data. The Market Analyzer calls getPriceHistory and calculateVolatility tools. Gemini analyzes the price data and returns a market analysis JSON. This gets added to state. The workflow continues to the Strategy Proposer Agent, which uses the portfolio and market analysis to formulate a recommendation. This agent calls estimateUniswapAPY and calculateOptimalRange. Gemini proposes a specific strategy and returns it as JSON. The workflow adds this to state and moves to the Risk Validator Agent.

The Risk Validator examines the proposed strategy and calls calculateImpermanentLoss. It determines whether the strategy is safe. If unsafe, it proposes adjustments. The risk validation JSON is added to state. Finally, the workflow calls the negotiator function (not an agent, just a TypeScript function) which applies the Nash bargaining algorithm to the strategy and risk validation. The negotiator returns a final recommendation which becomes the ultimate output. The workflow engine updates the JobState to status "complete" and stores the full final state including the recommendation.

**Step 8: Frontend Receives Recommendation**

The frontend's polling loop gets a response where status is "complete." It stops polling and extracts the final recommendation from the response. It updates the UI to show all four agents with checkmarks and displays a new section called "Recommendation" with a card showing the proposed action, expected APY, risk level, and a detailed explanation. For example: "Add liquidity to Uniswap ETH-USDC pool. Provide 0.3 ETH and 600 USDC in the price range $1800-$2200. Expected APY: 18%. Maximum impermanent loss: 8%. Reasoning: ETH is showing bullish momentum with stable volatility. Uniswap fees are attractive at current volumes. Your portfolio is well-balanced and this position offers good yield with acceptable risk."

Below this explanation, there are two buttons: "Execute Recommendation" and "Decline." If the user clicks Decline, the UI resets to the main dashboard. They can analyze again later if they wish.

**Step 9: User Approves Recommendation**

The user reads the recommendation and decides it makes sense. They click "Execute Recommendation." The frontend disables the button and shows a new status: "Building transaction..." It takes the details from the recommendation (like ETH amount 0.3, USDC amount 600, price range) and uses viem to encode a Uniswap V3 Router contract call. This involves calling methods like addLiquidity with the appropriate parameters. The frontend does not send this transaction yet. First, it uses viem's simulateContract to verify the transaction would succeed. If simulation fails, it shows an error to the user explaining what went wrong.

If simulation succeeds, the frontend also calls the backend at /api/log-recommendation with the recommendation data. The backend uses ethers to call the RebalanceLogger contract's logRecommendation function, passing the action type and full details as a JSON string. This writes the recommendation to the blockchain before the user even executes it, providing a transparent record that this recommendation was made. The logging transaction is sent from a backend wallet (not the user's wallet), so the user does not have to pay gas for logging.

**Step 10: Transaction Signing**

With the transaction built and recommendation logged, the frontend calls viem's wallet client to send the transaction. This triggers a MetaMask popup showing the transaction details. The popup displays the destination address (Uniswap V3 Router), the function being called (addLiquidity), the gas estimate, and the current gas price. The user reviews this. If comfortable, they click "Confirm" in MetaMask. MetaMask signs the transaction with the user's private key and broadcasts it to Sepolia via the selected RPC endpoint.

**Step 11: Transaction Broadcast**

MetaMask returns the transaction hash to the frontend. The frontend immediately displays this hash and a link to view it on Sepolia Etherscan. The UI shows "Transaction submitted. Waiting for confirmation..." with an animated progress indicator. The frontend uses viem's waitForTransactionReceipt with the transaction hash. This function polls the RPC every few seconds until the transaction is mined into a block.

On Sepolia, block times are around twelve seconds. After one or two blocks, the transaction gets included. The RPC returns a transaction receipt containing the block number, gas used, and success status. If the transaction succeeded, the frontend updates to show "✅ Transaction confirmed in block #7654321!" with a success animation. If the transaction reverted, it shows an error message explaining the failure reason extracted from the receipt logs.

**Step 12: Portfolio Refresh**

After successful transaction confirmation, the frontend automatically refreshes the portfolio data by re-fetching balances and prices. The portfolio card updates to show the new balances reflecting the liquidity provision. For example, if the user provided 0.3 ETH and 600 USDC to the pool, their displayed ETH balance decreases by 0.3 and USDC decreases by 600. Their total portfolio value should be roughly the same, but the allocation percentages shift.

The frontend also displays a note: "Your liquidity position is now active on Uniswap. You will earn fees from swaps in this pool. You can remove liquidity at any time." It includes a link to view their position on the Uniswap interface or directly on Etherscan.

**Step 13: On-Chain Verification**

At any time, anyone can verify what happened by visiting Sepolia Etherscan. They can look up the RebalanceLogger contract at 0x4F3DD9...B3B and call the getLatestRecommendation function with the user's wallet address. This returns the logged recommendation including action, details, timestamp, and execution status. They can also see the actual liquidity provision transaction on the Uniswap Router contract. The full history is transparent and immutable on the blockchain.

This completes the full cycle from connection to execution. The user can disconnect their wallet at any time. If they return to the app later, they connect again and see their updated portfolio. They can trigger a new analysis which will consider their current holdings including the LP position. The system is stateless from the backend perspective, but the blockchain provides all necessary persistence.

### 5.2 Data Flow Diagrams

**Diagram 1: Request Flow**

```
User Browser                   Express API                    LangGraph Workflow
     |                              |                                 |
     |-- POST /api/analyze -------->|                                 |
     |   {walletAddress}            |                                 |
     |                              |                                 |
     |                              |-- Generate jobId                |
     |                              |   Create JobState in Map        |
     |                              |                                 |
     |                              |-- Start workflow async -------->|
     |                              |   (jobId, walletAddress)        |
     |                              |                                 |
     |<-- 200 {jobId} --------------|                                 |
     |                              |                                 |
     |                              |                                 |
     |-- GET /api/status/:jobId --->|                                 |
     |                              |                                 |
     |                              |-- Lookup JobState in Map        |
     |                              |                                 |
     |<-- 200 {status, agent} ------|                                 |
     |                              |                                 |
     | (Poll every 2 seconds)       |                                 |
     |-- GET /api/status/:jobId --->|                                 |
     |<-- 200 {status: complete} ---|                                 |
     |    {recommendation}          |                                 |
```

**Diagram 2: Agent Workflow State Evolution**

```
State Object Flow Through Agents:

Initial State:
{ walletAddress: "0xABC...123" }
         |
         v
┌─────────────────────┐
│ Data Collector      │
│ Calls: getEthBalance│
│        getErc20Bal  │
│        getTokenPrice│
└─────────────────────┘
         |
         v
{ walletAddress, portfolio: {...} }
         |
         v
┌─────────────────────┐
│ Market Analyzer     │
│ Calls: getPriceHist │
│        calcVolatil  │
└─────────────────────┘
         |
         v
{ ..., marketAnalysis: {...} }
         |
         v
┌─────────────────────┐
│ Strategy Proposer   │
│ Calls: estimateAPY  │
│        calcRange    │
└─────────────────────┘
         |
         v
{ ..., strategyProposal: {...} }
         |
         v
┌─────────────────────┐
│ Risk Validator      │
│ Calls: calcIL       │
│        checkLimits  │
└─────────────────────┘
         |
         v
{ ..., riskValidation: {...} }
         |
         v
┌─────────────────────┐
│ Nash Negotiator     │
│ (Deterministic)     │
└─────────────────────┘
         |
         v
{ ..., finalRecommendation: {...} }
         |
         v
    Return to API
```

**Diagram 3: Transaction Execution Flow**

```
Frontend                 MetaMask              Blockchain             Backend
    |                        |                      |                    |
    |-- Build TX ----------->|                      |                    |
    |                        |                      |                    |
    |                        |                      |-- Log Rec -------->|
    |                        |                      |   (via backend wallet)
    |                        |                      |<-- TX Confirmed ---|
    |                        |                      |                    |
    |<-- Sign Request -------|                      |                    |
    |                        |                      |                    |
    | User approves          |                      |                    |
    |-- Signed TX ---------->|                      |                    |
    |                        |                      |                    |
    |                        |-- Broadcast TX ----->|                    |
    |                        |                      |                    |
    |<-- TX Hash ------------|                      |                    |
    |                        |                      |                    |
    | Poll for receipt       |                      |                    |
    |------------------------|------- Query RPC --->|                    |
    |<-----------------------|------- Receipt ------|                    |
    |                        |                      |                    |
    | Display confirmation   |                      |                    |
```

### 5.3 Error Handling Flow

Errors can occur at multiple points in the system. Here is how we handle them:

**Frontend Errors:**

If MetaMask is not installed, we display a helpful message with a link to install it. If the user's wallet is on the wrong network, we detect this via wagmi's useNetwork hook and show a network switch prompt. If the user rejects the wallet connection, we catch this error and display "Connection rejected. Please approve to continue." If an API call to the backend fails, we show a toast notification with the error and a retry button. If MetaMask transaction signing is rejected, we display "Transaction cancelled" and reset the UI to allow trying again.

**Backend Errors:**

If an agent workflow fails (LLM API error, tool failure, timeout), we update the JobState status to "error" and store the error message. The frontend polling will receive this error status and display it to the user. If Alchemy RPC is down, tools will retry up to three times with exponential backoff before failing. If CoinGecko API is rate-limited, we use cached price data if available (stored in memory for five minutes), or return an error if no cache. If the workflow takes longer than two minutes, we set a timeout and fail the job with message "Analysis timed out. Please try again."

**Smart Contract Errors:**

If the RebalanceLogger logging transaction reverts, we log this error but do not prevent the user from executing their transaction. Logging is for transparency, not functionality. If the user's Uniswap liquidity transaction fails due to insufficient balance, slippage, or other revert reasons, MetaMask will show the revert reason. The frontend displays this prominently and suggests possible fixes like "Insufficient USDC balance. You need 600 USDC but only have 500."

**Recovery Mechanisms:**

For transient errors like network timeouts, we implement automatic retries with backoff. For permanent errors like invalid input, we display clear error messages directing the user how to fix the issue. All errors are logged to the console with timestamps and context for debugging. In production, we would send error reports to a monitoring service like Sentry.

---

## 6. API Specifications

### 6.1 API Endpoint Definitions

**Endpoint 1: Start Portfolio Analysis**

```
POST /api/analyze

Request Body:
{
  "walletAddress": "0x1234567890123456789012345678901234567890"
}

Response:
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Analysis started. Use the jobId to poll for results."
}

Status Codes:
200 - Success, job started
400 - Invalid wallet address format
500 - Server error starting workflow
```

**Endpoint 2: Poll Job Status**

```
GET /api/status/:jobId

Response (in progress):
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "analyzing",
  "currentAgent": "Market Analyzer Agent",
  "progress": 0.5,
  "startTime": "2026-02-15T00:30:00Z"
}

Response (complete):
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "complete",
  "result": {
    "finalRecommendation": {
      "action": "add_liquidity",
      "details": {
        "pool": "ETH-USDC",
        "ethAmount": 0.3,
        "usdcAmount": 600,
        "priceRangeLower": 1800,
        "priceRangeUpper": 2200
      },
      "expectedAPY": 0.18,
      "maxRisk": 0.08,
      "confidence": 0.82,
      "explanation": "Detailed reasoning here..."
    },
    "workflowState": {
      "portfolio": {...},
      "marketAnalysis": {...},
      "strategyProposal": {...},
      "riskValidation": {...}
    }
  },
  "completedTime": "2026-02-15T00:30:45Z"
}

Response (error):
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "error",
  "error": "LLM API rate limit exceeded. Please try again in a few minutes."
}

Status Codes:
200 - Success
404 - Job ID not found
500 - Server error
```

**Endpoint 3: Get Current Portfolio**

```
GET /api/portfolio/:walletAddress

Response:
{
  "walletAddress": "0x1234...",
  "holdings": {
    "ETH": {
      "balance": 0.5,
      "priceUSD": 2000,
      "valueUSD": 1000
    },
    "USDC": {
      "balance": 1500,
      "priceUSD": 1.0,
      "valueUSD": 1500
    }
  },
  "totalValueUSD": 2500,
  "fetchedAt": "2026-02-15T00:31:00Z"
}

Status Codes:
200 - Success
400 - Invalid address
500 - Error fetching data
```

**Endpoint 4: Log Recommendation to Contract**

```
POST /api/log-recommendation

Request Body:
{
  "walletAddress": "0x1234...",
  "action": "add_liquidity",
  "details": "{\"pool\":\"ETH-USDC\",\"ethAmount\":0.3,...}"
}

Response:
{
  "success": true,
  "transactionHash": "0xabcdef...",
  "blockNumber": 7654321
}

Status Codes:
200 - Success
400 - Invalid input
500 - Transaction failed
```

### 6.2 WebSocket Alternative (Not Implemented in MVP)

For a production system, we would replace polling with WebSockets for real-time updates. The flow would be: frontend opens WebSocket connection, sends jobId, backend sends progress updates as they happen including "agent_started", "agent_completed", "workflow_complete" events. This reduces server load and provides instant feedback. However, for the hackathon MVP, polling every two seconds is simpler to implement and debug. The overhead is negligible for a small number of users.

---

## 7. Frontend Implementation

### 7.1 Component Structure

**App.tsx (Root Component):**

This component manages global state including wallet connection status and current network. It uses wagmi's useAccount hook to detect when a wallet connects or disconnects. It wraps the entire app in wagmi's WagmiConfig provider to enable Web3 functionality throughout the component tree. It also provides a simple navigation structure, though for the MVP we have a single-page app. If the wallet is not connected, it renders the WalletConnect component. Once connected, it renders the Dashboard component.

**WalletConnect.tsx:**

This component displays when no wallet is connected. It shows a call-to-action message explaining that users need MetaMask to use the app. It has a button labeled "Connect Wallet" that calls wagmi's connect function when clicked. On click, MetaMask prompts the user to select an account and approve. Upon successful connection, wagmi triggers a state update that causes App.tsx to re-render and show the Dashboard instead. The component includes error handling for cases where MetaMask is not installed, displaying a link to install it.

**Dashboard.tsx:**

This is the main view after wallet connection. It contains the Portfolio component at the top, showing current holdings. Below that is a prominent "Analyze Portfolio" button. When this button is clicked, the Dashboard makes the API call to /api/analyze and transitions to showing the AnalysisProgress component. Once analysis completes, it shows the RecommendationDisplay component. The Dashboard manages the flow between these states using React's useState hooks.

**Portfolio.tsx:**

This component fetches and displays the user's current token balances. It uses wagmi's useBalance hook to get ETH balance for the connected wallet address. For USDC balance, it uses viem's readContract function with the ERC20 ABI to call balanceOf on the USDC contract address. It calls a CoinGecko wrapper function to get current prices. With balances and prices, it calculates total value and renders a card with each token showing its balance, USD value, and a small price chart. The component shows skeleton loaders while data is fetching to provide visual feedback.

**AnalysisProgress.tsx:**

This component displays the real-time status of agent execution. It receives a jobId prop from the parent Dashboard. It starts a useEffect hook that polls /api/status/{jobId} every two seconds. It maintains local state for the job status and current agent. The UI shows a list of the four agents with checkmarks for completed ones, a spinner for the currently executing one, and grayed-out icons for pending ones. Below this is a text display showing what the current agent is doing, like "Market Analyzer is evaluating ETH price trends..." These messages are defined in the component based on which agent is running. When status becomes "complete," the component calls a callback prop to notify the parent Dashboard to transition to the recommendation view.

**RecommendationDisplay.tsx:**

This component receives the final recommendation data as a prop. It parses the recommendation object and displays the proposed action in a prominent card. The card header shows the action type with an icon (like a Uniswap logo for adding liquidity). The card body shows expected APY, risk level, and specific parameters like amounts and price ranges. Below that is an expandable section showing the detailed reasoning from the agents. At the bottom are two large buttons: "Execute Recommendation" in green and "Decline" in gray. When the user clicks Execute, this component calls a function to build the transaction data and sends it to the ExecuteTransaction component.

**ExecuteTransaction.tsx:**

This component handles the actual blockchain interaction. It receives transaction parameters (contract address, function call data, value) from the parent. It uses viem's wallet client to prepare the transaction. First, it simulates the transaction using simulateContract to check if it would succeed. If simulation passes, it displays a confirmation dialog showing gas estimates and what the transaction will do. When the user confirms, it calls wallet client's sendTransaction which triggers MetaMask. MetaMask signs and broadcasts the transaction. The component receives the transaction hash and displays it with a link to Etherscan. It uses waitForTransactionReceipt to poll for confirmation, showing a spinner and progress indicator. Once confirmed, it displays a success message and calls a callback to refresh the portfolio data.

### 7.2 State Management

We use React's built-in useState and useContext hooks rather than external state management libraries like Redux. This keeps the codebase simple for a hackathon. Wallet-related state like connected address and network is managed by wagmi internally. Job status and recommendation data live in Dashboard's local state and are passed down as props to child components. If this were a larger app, we might introduce Zustand for global state, but for our use case, prop drilling is acceptable and easier to follow.

### 7.3 Styling

We use Material-UI (MUI) for component styling. This gives us pre-built, accessible components like Button, Card, CircularProgress, and Dialog. We customize the MUI theme to match a DeFi aesthetic with dark mode support, blue and green accent colors, and smooth animations. For layout, we use MUI's Grid and Box components. Custom animations for agent progress and transaction confirmation are implemented with CSS transitions and MUI's Fade and Slide components. The goal is a polished, professional look that matches popular DeFi apps like Uniswap or Aave, without spending hours on custom CSS.

### 7.4 Error Handling in UI

Every component that makes an API call or blockchain interaction has try-catch blocks. Errors are displayed using MUI's Snackbar component, which shows a temporary notification at the bottom of the screen. For critical errors like failed transactions, we use a Dialog modal that the user must acknowledge. We provide actionable error messages, not generic "Something went wrong." For example, if a transaction fails due to insufficient balance, we say "You need 600 USDC but only have 500. Please acquire more USDC and try again." If an API endpoint is down, we say "Unable to reach the backend. Check your internet connection or try again later."

---

## 8. Smart Contract Integration

### 8.1 RebalanceLogger Contract

We have already deployed this contract to Sepolia at 0x4F3DD9522c2d1B240365516a46250226e4eB7B3B. Let me explain how the frontend and backend interact with it.

**Purpose:**

The RebalanceLogger contract serves as an immutable audit trail. Every time our system generates a recommendation, we log it on-chain. This provides transparency because anyone can verify what the AI suggested. It proves we are not changing recommendations retroactively. It allows users to see their full history of AI advice even if our backend is down or loses data. It demonstrates Web3 principles of transparency and decentralization.

**Key Functions:**

The logRecommendation function takes two string parameters: action and details. Action is a simple label like "add_liquidity" or "swap." Details is a JSON string containing the full recommendation including amounts, prices, reasoning, and timestamps. The function creates a Recommendation struct and pushes it to the user's array in the mapping. It emits a RecommendationLogged event that can be indexed by subgraphs or event listeners. This function is called by our backend using a backend wallet, not the user's wallet, so the user does not pay gas for logging.

The getLatestRecommendation function takes a user address and returns their most recent recommendation. This is a view function requiring no gas. The frontend can call this to display past recommendations.

The getAllRecommendations function returns an array of all recommendations for a given user. This allows the frontend to build a history view showing all past AI advice.

The markAsExecuted function allows updating a recommendation's executed flag to true. This can be called by the user or backend after they actually execute the transaction, providing a record of which recommendations were followed.

**Frontend Integration:**

After the user approves a recommendation, the frontend calls POST /api/log-recommendation. The backend receives this, connects to the RebalanceLogger contract using ethers.js with a backend wallet's private key, calls logRecommendation with the recommendation data, waits for the transaction to confirm, and returns the transaction hash to the frontend. The frontend can then display "Recommendation logged on-chain. View on Etherscan."

If we wanted to show recommendation history in the UI, we would call the contract's getAllRecommendations function using viem's readContract. This is a read-only call requiring no wallet signature. We would iterate through the returned array and display each recommendation with its timestamp and execution status. However, for the MVP, we are not building this history view to save time. The data is on-chain and could be added in future iterations.

### 8.2 Uniswap V3 Integration

**How Adding Liquidity Works:**

Uniswap V3 uses concentrated liquidity, meaning liquidity providers specify a price range rather than providing liquidity across all prices. When our system recommends adding liquidity, it specifies amounts of both tokens and a price range. The frontend uses ethers or viem to interact with the Uniswap V3 NonfungiblePositionManager contract at 0x1238536071E1c677A632429e3655c799b22cDA52 on Sepolia.

The specific function we call is mint with these parameters:
- token0: Address of the first token (WETH)
- token1: Address of the second token (USDC)
- fee: Fee tier (500 for 0.05%, 3000 for 0.3%, 10000 for 1%)
- tickLower: Lower bound of the price range (calculated from price)
- tickUpper: Upper bound of the price range
- amount0Desired: Amount of token0 to provide
- amount1Desired: Amount of token1 to provide
- amount0Min: Minimum token0 (for slippage protection)
- amount1Min: Minimum token1 (for slippage protection)
- recipient: User's wallet address
- deadline: Unix timestamp when transaction expires

The frontend encodes this function call using viem's encodeFunctionData with the Uniswap NonfungiblePositionManager ABI. This produces the transaction data bytes. Before sending, the frontend uses simulateContract to verify the transaction would succeed. This catches issues like insufficient balance or insufficient allowance. If the user has not approved the NonfungiblePositionManager to spend their tokens, the simulation will fail. In this case, the frontend must first send an approval transaction for each token.

**Token Approvals:**

ERC20 tokens require approval before a contract can transfer them. Before adding liquidity, the frontend checks the user's current allowance for WETH and USDC to the NonfungiblePositionManager using the ERC20 allowance function. If allowance is less than the amount to be provided, the frontend sends an approve transaction first. This transaction calls the ERC20 approve function with the NonfungiblePositionManager address and the amount to approve. After this approval transaction confirms, the frontend can send the actual mint transaction. For a better user experience, we could set allowance to max uint256 so future transactions do not need re-approval.

**Transaction Flow:**

The complete flow is: Check allowances for both tokens. If either is insufficient, send approval transactions and wait for confirmation. Build the mint transaction with all parameters. Simulate the transaction to ensure it will succeed. Send the transaction to MetaMask for signing. After user signs, broadcast the transaction to Sepolia. Wait for confirmation. Upon confirmation, read the event logs to find the token ID of the newly minted LP position. Display success message with the token ID and a link to view the position on Uniswap's interface.

**Removing Liquidity:**

For the MVP, we are not implementing liquidity removal in the UI. However, the user can always go directly to Uniswap's interface or use Etherscan to interact with the contract and remove their liquidity. The position is fully under their control since it is an NFT owned by their wallet address. In a future iteration, we could add a "Remove Liquidity" button that calls the decreaseLiquidity and collect functions on the NonfungiblePositionManager.

### 8.3 Reading On-Chain Data

**Fetching Balances:**

We use viem's publicClient to read blockchain data. For ETH balance, we call publicClient.getBalance with the wallet address. This returns a bigint representing wei (the smallest ETH unit). We convert to ETH by dividing by 10^18 and formatting with ethers.formatEther. For ERC20 tokens like USDC, we use publicClient.readContract with the token's contract address, the standard ERC20 ABI, and the balanceOf function. This returns the balance in the token's smallest unit. USDC has six decimals, so we divide by 10^6 to get the human-readable amount.

**Fetching Pool Data:**

For Uniswap pool statistics, we query The Graph's Uniswap V3 subgraph for Sepolia. We send a GraphQL query like:

```graphql
{
  pool(id: "0x6ce0896eae38c4fd7ac73de49b5b40ce7a1d3bb7") {
    liquidity
    token0Price
    token1Price
    volumeUSD
    feesUSD
  }
}
```

This returns current liquidity depth, token prices in the pool, 24-hour volume, and fees collected. We use this data to calculate expected APY. The formula is roughly: APY = (24h fees / liquidity) * 365. This is a simplified estimate. In reality, APY fluctuates based on trading volume and liquidity changes.

**Handling Chain Reorganizations:**

On rare occasions, the Sepolia chain might reorganize, meaning recent blocks are replaced with alternative blocks. To handle this, we wait for multiple confirmations before considering a transaction final. After waitForTransactionReceipt returns, we wait for at least two more blocks to be mined before updating the UI to show final confirmation. For the hackathon, we are not implementing this level of robustness, but it would be necessary for mainnet deployment.

---

## 9. External Dependencies

### 9.1 Google Gemini API

**Purpose:**

Gemini provides the language model intelligence that powers our agents. Each agent sends prompts to Gemini and receives structured responses. Gemini also handles tool calling, deciding when to invoke our tools based on the prompt and task at hand.

**API Details:**

We use the @langchain/google-genai package which wraps Google's official SDK. The base URL is generativelanguage.googleapis.com. We use the gemini-1.5-pro model for its strong reasoning and tool use capabilities. API requests include the API key in the header, the model name, the prompt text, tool definitions as JSON schemas, and generation config parameters like temperature and maxTokens. Responses contain the generated text and any tool calls the model wants to make.

**Rate Limits:**

The free tier allows 1500 requests per day and 60 requests per minute. For our hackathon use, this is more than sufficient. Each agent workflow makes approximately four to eight API calls (one per agent, plus retries if needed), so we can handle hundreds of user analyses per day. If we hit rate limits, the backend catches the 429 error, waits exponentially, and retries up to three times. If all retries fail, we return an error to the user saying "AI service temporarily unavailable."

**Cost Considerations:**

Gemini pricing for 1.5 Pro is free for the first 1500 requests/day. After that, it is $0.000125 per 1000 characters input and $0.000375 per 1000 characters output. For a typical agent workflow, we send about 2000 characters total across all agents and receive about 3000 characters. Cost per analysis is roughly $0.001, or one-tenth of a cent. Even if we did 10,000 analyses, the cost would be only $10. This is incredibly affordable for an MVP. For comparison, OpenAI GPT-4 would cost approximately ten times more.

**Prompt Injection Protection:**

Since our prompts include user-provided wallet addresses, there is a theoretical risk of prompt injection where a user crafts their address to trick the LLM into doing something unintended. However, wallet addresses are fixed-length hex strings validated with regex before being inserted into prompts. They cannot contain natural language instructions. The user's holdings data is purely numeric and comes from the blockchain, not user input. Thus, prompt injection risk is minimal. We also structure agent outputs as JSON, making it harder for an LLM to output executable code or malicious content.

### 9.2 Alchemy RPC

**Purpose:**

Alchemy provides reliable blockchain RPC access for reading Sepolia data and broadcasting transactions. We use it for balance queries, contract reads, and transaction submission.

**Endpoints:**

We use the Enhanced API which provides eth_getBalance, eth_call for contract reads, eth_sendRawTransaction for broadcasting, and batch request support for efficiency. The base URL is eth-sepolia.g.alchemy.com/v2/{apiKey}. We configure our provider in ethers or viem with this URL.

**Rate Limits:**

The free tier allows 300 requests per second, far more than we will use. We implement basic rate limiting in our tools to avoid bursts, but realistically our bottleneck is the LLM API, not Alchemy.

**Reliability:**

Alchemy has very high uptime (99.9% SLA). In case of downtime, we could switch to Infura as a backup RPC by simply changing the URL. Our tools accept the RPC URL as a config parameter, making this switch trivial.

### 9.3 CoinGecko API

**Purpose:**

CoinGecko provides current and historical cryptocurrency prices. We use it to get real-time USD prices for ETH and USDC, plus historical price data for trend analysis.

**Endpoints:**

We use /simple/price for current prices and /coins/{id}/market_chart for historical data. The free tier has no authentication required and allows 50 calls per minute. Each agent workflow makes two to four price API calls.

**Data Caching:**

To reduce API calls, we implement in-memory caching. When we fetch a token price, we store it with a timestamp. If another request comes within five minutes for the same token, we return the cached price instead of making a new API call. This reduces load on CoinGecko and speeds up our responses. The downside is prices might be slightly stale, but for our analysis purposes, five-minute-old prices are acceptable.

**Fallback Strategy:**

If CoinGecko is down or rate-limited, we could fall back to getting prices from Uniswap pools directly by reading the pool's current price from the pool contract. This is more complex because it requires calculating the price from Uniswap's sqrt price encoding, but it is possible. For the MVP, we do not implement this fallback. If CoinGecko fails, the workflow fails and the user sees an error.

### 9.4 The Graph (Uniswap Subgraph)

**Purpose:**

The Graph indexes Uniswap smart contract events and provides a GraphQL API for querying historical and aggregated data like pool statistics, volume, and fees.

**Endpoints:**

We query the official Uniswap V3 Sepolia subgraph at api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-sepolia. We send GraphQL queries for pool data including liquidity, volume, and fee metrics.

**Rate Limits:**

The free tier allows 1000 queries per day. Each workflow makes one to two queries. This is sufficient for the hackathon. If we exceed limits, we implement caching similar to CoinGecko.

**Alternative:**

If The Graph is unavailable, we could query Uniswap contracts directly using RPC calls. This is more complex because we would need to aggregate events ourselves. The Graph abstracts this complexity, which is why we prefer using it.

---

## 10. Development Roadmap

### 10.1 Phase 0: Environment Setup (Completed)

We have already completed the foundational setup including deploying the RebalanceLogger smart contract, configuring Hardhat for Sepolia, obtaining API keys for Gemini and Alchemy, initializing the agents project with TypeScript and dependencies, and creating the project folder structure. The next phases build on this foundation.

### 10.2 Phase 1: Backend Agent System (Priority: Critical, Time: 3 hours)

**Step 1: Implement Tool Functions**

Create tool files in src/tools/ for each blockchain and API interaction. Start with balance-reader.ts which exports getEthBalance and getErc20Balance functions. These use ethers.js to connect to Alchemy RPC and query balances. Next, create price-fetcher.ts with getTokenPrice and getPriceHistory functions calling CoinGecko. Then pool-data.ts for querying The Graph's Uniswap subgraph. Each tool function should be async, handle errors gracefully, and return structured data matching TypeScript interfaces defined in src/types/.

**Step 2: Define Agent Prompts**

Create files in src/agents/ for each agent: data-collector.ts, market-analyzer.ts, strategy-proposer.ts, risk-validator.ts. Each file exports a function that constructs the agent's prompt given the current state. The prompt includes the agent's role, available tools, step-by-step instructions, and output format specification. Use template literals to inject dynamic data like wallet address and previous agent outputs.

**Step 3: Implement LangGraph Workflow**

In src/workflow.ts, import LangGraph's StateGraph class. Define a TypeScript interface for the workflow state containing wallet address, portfolio, market analysis, strategy proposal, risk validation, and final recommendation. Create the graph with nodes for each agent. Each node is an async function that receives state, calls Gemini with the agent's prompt and tools, processes the response, updates state, and returns it. Add edges connecting nodes in sequence. Implement the negotiator as a final node that applies the deterministic algorithm.

**Step 4: Test Agent Workflow**

Create a test script in src/test-workflow.ts that manually triggers the workflow with a hardcoded wallet address. Run it with tsx and verify that each agent executes, tools are called correctly, and the final recommendation is generated. Fix any issues with tool calls, JSON parsing, or state management. This script is invaluable for debugging the agent system in isolation before connecting it to the API.

**Step 5: Build Express API**

In src/index.ts, set up an Express server with routes for /api/analyze and /api/status/:jobId. The analyze route generates a job ID, creates a JobState entry, starts the workflow asynchronously, and returns the job ID. The status route looks up the job in the map and returns its current state. Implement CORS middleware to allow frontend requests. Add error handling middleware to catch and format errors consistently.

**Success Criteria:**

You can send a POST request to /api/analyze with a wallet address and receive a job ID. Polling the status endpoint shows progress through agents. After completion, the status endpoint returns a valid final recommendation with all fields populated. The console logs show each agent's prompts, tool calls, and outputs for debugging.

### 10.3 Phase 2: Frontend Development (Priority: High, Time: 2.5 hours)

**Step 1: Set Up React App**

Initialize a new Vite React project with TypeScript template. Install dependencies including wagmi, viem, mui, and axios. Configure wagmi with Sepolia as the chain and MetaMask as the connector. Create a basic App.tsx that sets up wagmi config provider and renders a simple welcome message.

**Step 2: Implement Wallet Connection**

Create WalletConnect.tsx component with a connect button using wagmi's useConnect hook. Test that clicking the button opens MetaMask and successfully connects. Display the connected address in the UI. Add error handling for cases where MetaMask is not installed or the user rejects.

**Step 3: Build Portfolio Display**

Create Portfolio.tsx that uses useBalance for ETH and readContract for USDC. Make API calls to CoinGecko for prices. Calculate total value and display in a styled card using MUI. Add loading skeletons and error states.

**Step 4: Implement Analysis Trigger and Progress**

In Dashboard.tsx, add an "Analyze Portfolio" button that calls the backend /api/analyze endpoint. On receiving a job ID, switch to rendering AnalysisProgress.tsx which polls /api/status. Display agent progress with animated checkmarks and spinners. Test the full flow end-to-end.

**Step 5: Build Recommendation Display and Transaction Execution**

Create RecommendationDisplay.tsx to show the final recommendation with clear formatting. Add Execute and Decline buttons. When Execute is clicked, call a function to build the Uniswap transaction using viem. Implement transaction signing via MetaMask and confirmation polling. Display success or error messages.

**Success Criteria:**

You can open the app, connect MetaMask, see your Sepolia balances, click analyze, watch agents progress, see a recommendation, approve it, sign the transaction in MetaMask, and see confirmation. The UI is polished with smooth transitions and clear messaging at each step.

### 10.4 Phase 3: Integration and Testing (Priority: Medium, Time: 1.5 hours)

**Step 1: End-to-End Testing**

Test the complete user flow multiple times with different wallet addresses and portfolio states. Verify that recommendations make sense given the inputs. Test edge cases like zero balances, very small balances, and very large balances.

**Step 2: Error Scenario Testing**

Deliberately cause errors to test handling: disconnect wallet mid-analysis, reject MetaMask transaction, switch networks during analysis, provide invalid wallet address. Verify that error messages are clear and the UI recovers gracefully.

**Step 3: Performance Optimization**

Profile the backend to identify slow tools or agent calls. Implement caching for repeated API calls. Optimize frontend rendering to avoid unnecessary re-fetches. Ensure the analyze-to-recommendation flow completes in under one minute.

**Step 4: UI Polish**

Refine styling, animations, and layout. Ensure responsive design works on mobile and tablet. Add helpful tooltips and explanatory text. Improve loading states and transitions. Make the app visually appealing and professional.

**Success Criteria:**

The app works reliably across multiple test runs. Errors are handled gracefully with clear user guidance. Performance is smooth with analysis completing quickly. The UI looks polished and is easy to use.

### 10.5 Phase 4: Documentation and Demo Prep (Priority: Low, Time: 1 hour)

**Step 1: Code Documentation**

Add comments to complex functions explaining their logic. Write README files for each major folder (agents, contracts, frontend) describing what they contain. Update the root README with setup instructions, architecture overview, and how to run the project.

**Step 2: Prepare Demo Script**

Write a step-by-step demo script for presenting the project. Identify the most impressive aspects to highlight. Prepare a test wallet with a good portfolio for demonstrating live. Record a backup video demo in case live demo has technical issues.

**Step 3: Deploy to Hosting**

Deploy the backend to a service like Railway or Render. Deploy the frontend to Vercel or Netlify. Update environment variables for production. Test the deployed version thoroughly.

**Success Criteria:**

The code is well-documented and easy for others to understand. The demo script is clear and compelling. The app is deployed and accessible via a public URL.

---

## 11. Future Enhancements (Beyond Hackathon)

While these are out of scope for the MVP, here are ideas for future iterations:

**Multi-Protocol Support:** Add agents for Compound, Curve, and Lido to provide recommendations across more DeFi protocols.

**Historical Performance Tracking:** Store executed recommendations in a database and track their actual performance versus predicted APY.

**User Preferences:** Allow users to set risk tolerance, preferred protocols, and excluded tokens to personalize recommendations.

**Automated Execution:** Implement smart contract automation where users pre-approve strategies and the system executes them autonomously based on triggers.

**Mobile App:** Build native iOS and Android apps with push notifications for recommendations and price alerts.

**Mainnet Deployment:** After thorough testing and audits, deploy to Ethereum mainnet and other L1/L2 chains.

**Social Features:** Let users share strategies, follow top-performing portfolios, and discuss recommendations in a community forum.

**Advanced Risk Models:** Implement more sophisticated risk calculations including VaR, CVaR, and correlation analysis across multiple assets.

**NFT Integration:** Support NFT holdings in portfolio analysis and recommend NFT-based DeFi strategies like NFTfi or JPEG'd.

**DAO Governance:** Allow token holders to vote on system parameters, fee structures, and new feature priorities.

---

## 12. Conclusion

This document serves as the single source of truth for the Autonomous DeFi Portfolio Manager project. It covers every aspect from high-level architecture to implementation details, data flows to API specifications. Anyone reading this document, whether human or AI assistant like Claude Code, should have a complete understanding of what we are building, why we made specific design decisions, and how all the pieces fit together.

The key insights to remember are: this is a non-custodial, stateless architecture where user identity is tied to wallet addresses. We use four specialized Gemini-powered agents that reason about different aspects of portfolio management. A deterministic negotiator ensures the final recommendation balances returns and risk through transparent math rather than opaque AI. The blockchain serves as our persistent storage through the RebalanceLogger contract. The frontend provides a seamless user experience abstracting away complexity. All external dependencies are well-understood with fallback strategies.

By following the phased roadmap, you can build this system incrementally, testing each component before moving to the next. The MVP is achievable within a hackathon timeframe while still demonstrating genuine innovation in applying LLM agents to DeFi portfolio management.

Now, let's build it.