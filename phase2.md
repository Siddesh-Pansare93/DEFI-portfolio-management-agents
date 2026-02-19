# Autonomous DeFi - Phase 2 Full Upgrade Plan

## Context & Problem Statement

Transform the current deterministic rule-engine into a genuine AI-powered multi-agent system where:
1. All 5 agents use Gemini LLM for reasoning (with deterministic fallback safety nets)
2. Strategy Proposer and Risk Validator negotiate up to 10 rounds like human experts
3. Analysis covers ALL 25 tokens in the portfolio, not just ETH/USDC
4. Market analysis uses news, sentiment, technical indicators, and DeFi metrics
5. Frontend has a full DeFi dashboard with risk preferences, history, and live market data

---

## Prerequisites Check — Before Starting

### ✅ Already Have
| Requirement | Status | Value |
|-------------|--------|-------|
| Google Gemini API Key | ✅ In .env | `GOOGLE_API_KEY=...` |
| CoinGecko API Key | ✅ In .env | `COINGECKO_API_KEY=...` |
| Sepolia RPC (Alchemy) | ✅ In .env | `SEPOLIA_RPC_URL=...` |
| NewsAPI Key | ✅ Provided | `9488931a766d41e` |
| `@langchain/google-genai` | ✅ Installed | Already in package.json |
| `@langchain/langgraph` | ✅ Installed | Already in package.json |
| `zod` | ✅ Installed | For tool schemas |
| `axios` | ✅ Installed | For API calls |

### 🔑 New APIs to Add to `.env`
```env
# Add to agents/.env:
NEWS_API_KEY=9488931a766d41e
# Fear & Greed Index (https://api.alternative.me/fng/) — NO KEY NEEDED
# DeFiLlama (https://api.llama.fi) — NO KEY NEEDED
```

### 📦 No New npm Packages Needed
All required packages are already installed. The upgrade is purely code-level.

---

## Architecture: Hybrid Deterministic + Gemini

**Philosophy**: Gemini for reasoning and language; deterministic math as safety net.

```
[Gemini LLM] ←→ [Tool Functions] → [Validated Output]
     ↓                                      ↓
 Reasoning text              Deterministic fallback if LLM fails
 Strategy language           Math verification of LLM's numbers
 Negotiation messages        Schema validation via Zod
```

Every agent:
1. Calls Gemini with tools → gets reasoning + decision
2. Validates Gemini's JSON output with Zod schema
3. If invalid/missing → falls back to existing deterministic logic
4. Returns same `WorkflowState` shape (no breaking changes)

---

## Multi-Token Portfolio Support

**Current**: Only ETH + USDC tracked.
**New**: All 25 tokens from `config.tokenSymbols` analyzed.

**Updated `PortfolioData`**:
```typescript
interface PortfolioData {
  holdings: Record<string, TokenHolding>;  // All tokens, not just ETH/USDC
  topHoldings: string[];                   // Top 5 by value
  totalValueUSD: number;
  allocationPercent: Record<string, number>;
  dominantToken: string;                   // Largest holding
  uniswapPool: { address, liquidity, volume24h, feeAPR };
  diversificationScore: number;            // HHI from existing calculateDiversificationScore()
}
```

**Data Collector** now calls `getMultiTokenPortfolio(walletAddress)` (already exists in `tools/multi-token-portfolio.ts`) to get all 25 token balances + prices.

Market Analyzer and Strategy Proposer then work with the full portfolio rather than just ETH/USDC.

---

## 10-Round Negotiation Protocol

**Termination conditions** (whichever comes first):
- Risk Validator approves the proposal → done immediately
- Both agents reach a compromise they explicitly label "AGREED" → done
- Round 10 forced termination → Nash Negotiator makes final decision

**Round Tone Evolution** (baked into system prompts):

| Round | StrategyProposer Stance | RiskValidator Stance |
|-------|------------------------|---------------------|
| 1 | Confident: proposes optimal strategy | Strict: applies all limits rigidly |
| 2-3 | Acknowledges concerns, minor adjustments | Explains specific violations clearly |
| 4-5 | Starts making concessions, proposes alternatives | Starts softening on edge cases |
| 6-7 | "Meeting in the middle" language | "I can accept X if you change Y" |
| 8-9 | Near-agreement, fine-tuning only | Final objections only |
| 10 | Proposes most conservative acceptable option | Must decide yes or no |

**NegotiationMessage Schema**:
```typescript
interface NegotiationMessage {
  round: number;
  from: 'StrategyProposer' | 'RiskValidator' | 'NashNegotiator';
  type: 'proposal' | 'critique' | 'refinement' | 'counter_proposal' |
        'concession' | 'agreement' | 'escalation' | 'final_decision';
  content: string;           // Full human-readable reasoning (shown in UI)
  proposalRef?: string;      // Which proposal version this refers to (v1, v2...)
  keyPoints: string[];       // Bullet points for quick UI display
  timestamp: Date;
}
```

---

## Phase A: New Data Tools (4 hours)

### New Files to Create:

**`agents/src/tools/news-fetcher.ts`**

Functions:
- `getCryptoNews(query: string, pageSize = 10): Promise<NewsItem[]>`
  - URL: `https://newsapi.org/v2/everything?q=${query}&apiKey=${config.newsApiKey}&sortBy=publishedAt&language=en&pageSize=${pageSize}`
  - Cache: 30 minutes (news doesn't change rapidly)
- `getMultiTokenNews(tokens: string[]): Promise<Record<string, NewsItem[]>>`
  - Batch fetch news for top 3-5 holdings
- `calculateNewsSentiment(articles: NewsItem[]): number`
  - Returns -1 to +1 score from keyword analysis

```typescript
interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}
```

**`agents/src/tools/fear-greed.ts`**

Functions:
- `getFearGreedIndex(): Promise<{value: number, label: string, trend: 'improving'|'declining'|'stable'}>`
  - URL: `https://api.alternative.me/fng/?limit=2` (current + yesterday for trend)
  - No API key needed
  - Cache: 1 hour

**`agents/src/tools/defi-llama.ts`**

Functions:
- `getUniswapTVL(): Promise<{total: number, change24h: number}>`
  - URL: `https://api.llama.fi/protocol/uniswap`
  - Cache: 5 minutes
- `getGlobalDeFiTVL(): Promise<{total: number}>`
  - URL: `https://api.llama.fi/tvl`

**`agents/src/tools/technical-analysis.ts`** (new file, adds to existing `analysis.ts`)

Functions (pure TypeScript math, no external libs):
- `calculateRSI(prices: number[], period = 14): number`
- `calculateEMA(prices: number[], period: number): number[]`
- `calculateMACD(prices: number[]): {value: number, signal: number, histogram: number}`
- `calculateBollingerBands(prices: number[]): {upper: number, middle: number, lower: number, percentB: number}`
- `calculateSupportResistance(prices: number[]): {support: number, resistance: number}`
- `performFullTechnicalAnalysis(prices: number[]): TechnicalAnalysisResult`

---

## Phase B: Agent Rewrites (8 hours)

### Gemini Tool-Calling Pattern (used in all agents)

```typescript
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-pro',
  apiKey: config.googleApiKey,
  temperature: 0.3,
});

// Tool-calling agentic loop
async function runAgentLoop(
  llmWithTools: any,
  messages: any[],
  toolExecutors: Record<string, Function>
): Promise<string> {
  while (true) {
    const response = await llmWithTools.invoke(messages);
    messages.push(response);
    if (!response.tool_calls || response.tool_calls.length === 0) {
      return response.content as string;
    }
    for (const tc of response.tool_calls) {
      const executor = toolExecutors[tc.name];
      const result = executor ? await executor(tc.args) : 'Tool not found';
      messages.push(new ToolMessage({ content: JSON.stringify(result), tool_call_id: tc.id }));
    }
  }
}

// Fallback: if Gemini fails, run deterministic logic
async function withFallback<T>(geminiCall: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await geminiCall();
  } catch (err) {
    console.warn('Gemini failed, using deterministic fallback:', (err as Error).message);
    return fallback();
  }
}
```

### Agent 1: Data Collector (Minor Update)

**File**: `agents/src/agents/data-collector.ts`

Changes:
- Import `getMultiTokenPortfolio` from `tools/multi-token-portfolio.ts` (already exists)
- Replace ETH+USDC-only fetch with full multi-token portfolio fetch
- Keep same `PortfolioData` interface but extend `holdings` to `Record<string, TokenHolding>`
- No LLM needed here — pure data collection stays deterministic

### Agent 2: Market Analyzer (Full LLM Rewrite)

**File**: `agents/src/agents/market-analyzer.ts`

**New Interface**:
```typescript
interface DeepMarketAnalysis {
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
    bollingerBands: { upper: number; middle: number; lower: number };
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
}
```

**Gemini Tools Bound**:
- `getPriceHistoryTool` — `getPriceHistory(tokenSymbol, 30)` for ETH + top holdings
- `getCryptoNewsTool` — `getCryptoNews(query)` for each top token
- `getFearGreedTool` — `getFearGreedIndex()`
- `getDeFiLlamaTVLTool` — `getUniswapTVL()`
- `performTechnicalAnalysisTool` — `performFullTechnicalAnalysis(prices)`

**System Prompt**:
```
You are a senior DeFi market analyst with expertise in technical analysis, on-chain metrics,
and macroeconomic signals. You have access to real-time market data tools.

Your task: Analyze the current market conditions for this portfolio and provide a comprehensive
assessment. Consider ALL the following:
1. Price trends (30d, 7d, 1d)
2. Technical indicators (RSI, MACD, Bollinger Bands)
3. Recent news sentiment for each significant holding
4. Fear & Greed index
5. Uniswap TVL health
6. Support/resistance levels

Return your analysis as valid JSON. Be specific and cite exact data values you gathered.
```

**Fallback**: If Gemini fails, run existing deterministic `runMarketAnalyzer()` logic.

### Agent 3: Strategy Proposer (LLM with Negotiation Rounds)

**File**: `agents/src/agents/strategy-proposer.ts`

**Round-Aware System Prompts**:

Round 1 prompt:
```
You are an expert DeFi portfolio manager. Based on the comprehensive market analysis,
propose the OPTIMAL strategy for this portfolio. The user has ${portfolio.totalValueUSD}
in tokens: ${topHoldings.join(', ')}.

User preferences: Risk appetite = ${prefs.riskAppetite}, Max IL = ${prefs.maxImpermanentLoss}%,
Max position = ${prefs.maxPositionSize}%

Generate ONE clear strategy with detailed justification citing specific data points.
This is Round 1 of negotiation. Be thorough and confident.
```

Round 2+ prompt:
```
You are refining your strategy based on the Risk Validator's feedback.

Your previous proposal (v${round-1}): ${previousProposal}
Risk Validator's critique: ${lastCritique.content}
Their key concerns: ${lastCritique.keyPoints.join(', ')}

Address EACH concern specifically. Show your reasoning for any adjustments made.
Round ${round} of up to 10. If we're beyond round 5, start finding genuine compromise.
```

**Output Logged as NegotiationMessage**: `{type: round===1 ? 'proposal' : 'refinement', content: Gemini's full text}`

### Agent 4: Risk Validator (LLM with Round-Aware Critique)

**File**: `agents/src/agents/risk-validator.ts`

**Round-Aware System Prompts**:

Round 1 critique:
```
You are a strict DeFi risk manager. Evaluate this strategy against these limits:
- Max IL: ${prefs.maxImpermanentLoss}% | Max Position: ${prefs.maxPositionSize}%
- Risk Appetite: ${prefs.riskAppetite}

Use your tools to calculate actual IL and position sizes.
If you reject, write SPECIFIC, ACTIONABLE critiques (not vague concerns).
Example good critique: "The range [2800-3400] has max IL of 9.2% which exceeds 7% limit.
Narrowing to [2900-3200] would reduce IL to 6.8%."
```

Round 4-6 critique:
```
You've rejected ${round-1} proposals. Both parties need to find common ground.
Be open to accepting a slightly higher risk if returns justify it.
Consider the user's risk appetite (${prefs.riskAppetite}).
What EXACTLY would make you approve? State your minimum acceptable conditions.
```

Round 8-10 final evaluation:
```
This is Round ${round}. We must reach a decision.
Either approve this strategy or clearly state the SINGLE most important unresolvable concern.
If nothing catastrophic: approve with conditions rather than reject.
```

**Negotiation Message Logged**: `{type: approved ? 'approval' : (round>5 ? 'concession' : 'critique'), keyPoints: [...]}`

### Agent 5: Nash Negotiator (LLM-Authored Explanation)

**File**: `agents/src/agents/negotiator.ts`

Keep deterministic Nash formula for the actual numerical decision. Add Gemini call ONLY for writing the final explanation:

```typescript
// 1. Run deterministic Nash formula (existing code)
const nashDecision = computeNashEquilibrium(strategyProposal, riskValidation);

// 2. Gemini writes the explanation
const explanation = await generateNashExplanation(llm, {
  negotiationMessages,      // Full conversation history
  strategyProposals,        // All versions
  finalDecision: nashDecision,
  rounds: negotiationRound
});

// 3. Combine
finalRecommendation = { ...nashDecision, explanation };
```

Gemini prompt for explanation:
```
You mediated a ${negotiationRound}-round negotiation between a Strategy Proposer and Risk Validator.
Here is the full conversation: ${negotiationMessages}
The Nash equilibrium calculation produced: ${nashDecision}

Write a comprehensive final report (3-5 paragraphs) that:
1. Summarizes what was debated over the rounds
2. Explains why this final recommendation was chosen
3. States clearly what the user should do and why
4. Mentions any remaining risks the user should monitor
```

---

## Phase C: Negotiation Engine in LangGraph (3 hours)

### Updated WorkflowState Type (`agents/src/types/index.ts`)

**Add these new interfaces and extend WorkflowState**:
```typescript
interface NegotiationMessage {
  round: number;
  from: 'StrategyProposer' | 'RiskValidator' | 'NashNegotiator';
  type: 'proposal' | 'critique' | 'refinement' | 'counter_proposal' |
        'concession' | 'agreement' | 'escalation' | 'final_decision';
  content: string;
  keyPoints: string[];
  proposalRef?: string;
  timestamp: Date;
}

interface UserPreferences {
  maxImpermanentLoss: number;  // default 10
  maxPositionSize: number;     // default 70
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  preferredActions: ('add_liquidity' | 'swap' | 'hold')[];
}

// Extend WorkflowState:
interface WorkflowState {
  walletAddress: string;
  userPreferences: UserPreferences | null;       // NEW
  portfolio: PortfolioData | null;
  deepMarketAnalysis: DeepMarketAnalysis | null; // NEW (replaces marketAnalysis)
  strategyProposals: StrategyProposal[];         // NEW (array, all rounds)
  currentProposal: StrategyProposal | null;      // NEW
  riskValidation: RiskValidation | null;
  negotiationRound: number;                      // NEW
  negotiationMessages: NegotiationMessage[];     // NEW
  finalRecommendation: FinalRecommendation | null;
}
```

### Updated workflow.ts

**Conditional routing after RiskValidator**:
```typescript
const MAX_NEGOTIATION_ROUNDS = 10;

function routeAfterRiskValidation(state: WorkflowState): string {
  const { riskValidation, negotiationRound } = state;

  if (riskValidation?.approved) return 'negotiator';           // Agreement reached
  if (negotiationRound >= MAX_NEGOTIATION_ROUNDS) return 'negotiator'; // Max rounds → force decision
  return 'strategyProposer';  // Loop: Proposer refines based on critique
}

workflow.addConditionalEdges('riskValidator', routeAfterRiskValidation, {
  'strategyProposer': 'strategyProposer',
  'negotiator': 'negotiator'
});
```

**New state channels** (add to `StateGraph` definition):
- `negotiationRound`: reducer `(old, new) => new ?? old ?? 0`
- `negotiationMessages`: reducer `(old, new) => new ?? old ?? []`
- `strategyProposals`: reducer `(old, new) => new ?? old ?? []`
- `currentProposal`, `userPreferences`, `deepMarketAnalysis`: standard `right ?? left ?? null`

---

## Phase D: Backend API Updates (2 hours)

### Updated `POST /api/analyze` (`agents/src/index.ts`)

Accept preferences:
```typescript
{
  "walletAddress": "0x...",
  "preferences": {
    "maxImpermanentLoss": 8,
    "maxPositionSize": 60,
    "riskAppetite": "moderate",
    "preferredActions": ["add_liquidity", "hold"]
  }
}
```
Store in `job.state.userPreferences` and pass to workflow.

### Updated `GET /api/status/:jobId`

Includes `negotiationMessages` and `negotiationRound` in response so frontend can show real-time chat.

### New `GET /api/market-overview`

Quick snapshot, no analysis job needed:
```json
{
  "fearGreedIndex": 65,
  "fearGreedLabel": "Greed",
  "ethPrice": 2450,
  "uniswapTVL": 4200000000,
  "topTokenPrices": {"ETH": 2450, "USDC": 1.0, "UNI": 8.5},
  "timestamp": "..."
}
```

### New `GET /api/history/:walletAddress`

Reads from RebalanceLogger contract via ethers.js, returns on-chain history.

---

## Phase E: Frontend Dashboard (parallel to backend)

> **Start building frontend in parallel** — these components don't depend on the new backend endpoints (mock data until backend is ready)

### New Routes

```
/                          Landing page (keep existing)
/analyze                   Analysis page (enhanced negotiation chat)
/dashboard                 NEW: Main DeFi dashboard (requires wallet)
/dashboard/settings        NEW: Risk preferences
/dashboard/history         NEW: Past analyses + on-chain logs
```

### Frontend Requirements by Page

---

### 1. `/dashboard` — Main Dashboard

**Purpose**: Home for connected users. Portfolio overview + live market data.

**Data Sources**:
- `GET /api/portfolio/:walletAddress` → portfolio holdings (existing)
- `GET /api/market-overview` → live market data (new)
- localStorage → recent job IDs

**Components to Build**:

| Component | Data | Description |
|-----------|------|-------------|
| `DashboardNav.tsx` | wallet state | Connected wallet address + disconnect |
| `PortfolioValueCard.tsx` | portfolio API | Total USD value, 24h change |
| `TokenHoldingsTable.tsx` | portfolio API | Table: token, balance, price, value, % allocation |
| `MarketPulseBar.tsx` | market-overview API | Fear&Greed gauge, ETH price, Uniswap TVL |
| `QuickAnalyzeButton.tsx` | — | Big CTA button, pre-fills wallet, goes to /analyze |
| `RecentAnalysesWidget.tsx` | localStorage jobIds | Last 3 completed analysis summaries |
| `OnChainHistoryWidget.tsx` | /api/history/:addr | List of on-chain logged recommendations |

**Layout** (desktop): 3-column grid
- Left: `PortfolioValueCard` + `TokenHoldingsTable`
- Center: `MarketPulseBar` + `QuickAnalyzeButton`
- Right: `RecentAnalysesWidget` + `OnChainHistoryWidget`

---

### 2. `/dashboard/settings` — Risk Preferences

**Purpose**: User sets their risk parameters before analysis.

**Storage**: `localStorage` key `defi_user_preferences`

**Components to Build**:

| Component | Input | Output |
|-----------|-------|--------|
| `RiskToleranceSlider.tsx` | maxImpermanentLoss (1-20%) | Slider + IL preview (show "at 8%, if ETH moves 20%, you lose ~X%") |
| `PositionSizeLimiter.tsx` | maxPositionSize (10-90%) | Slider + portfolio impact preview |
| `RiskAppetiteCard.tsx` | conservative/moderate/aggressive | 3 clickable cards with description |
| `PreferredActionsSelector.tsx` | add_liquidity/swap/hold | Checkbox group |
| `SavePreferencesButton.tsx` | — | Saves to localStorage, shows toast |

**Default values**:
- maxImpermanentLoss: 10%
- maxPositionSize: 70%
- riskAppetite: 'moderate'
- preferredActions: ['add_liquidity', 'swap', 'hold']

---

### 3. `/dashboard/history` — Analysis History

**Purpose**: View past analyses and on-chain logs.

**Components to Build**:

| Component | Data | Description |
|-----------|------|-------------|
| `AnalysisHistoryList.tsx` | localStorage jobIds | Cards: date, wallet, action, confidence |
| `AnalysisDetailDrawer.tsx` | GET /api/status/:jobId | Slide-out drawer with full results |
| `OnChainLogTable.tsx` | GET /api/history/:addr | Table: timestamp, action, details, tx hash |
| `EtherscanLink.tsx` | tx hash | Link to sepolia.etherscan.io |

---

### 4. Enhanced `/analyze` — Negotiation Theater

**New component**: `NegotiationChamber.tsx`

This is the key professor-demo component. Shows the agent negotiation as a chat conversation.

**Visual Design**:
```
┌─────────────────────────────────────────────────────────┐
│  ⚡ AGENT NEGOTIATION CHAMBER  [Round 3 of up to 10]    │
├─────────────────────────────────────────────────────────┤
│  🧠 STRATEGY PROPOSER                            Round 1│
│  ┌──────────────────────────────────────────────────┐   │
│  │ [PROPOSAL] Based on RSI at 58 (neutral-bullish)  │   │
│  │ and Fear & Greed at 65 (Greed), I propose adding │   │
│  │ liquidity: 0.04 ETH + $45 USDC in range          │   │
│  │ [2200-3000]. Expected APY: 22%                   │   │
│  │ ──────────────────────────────────────────────── │   │
│  │ • RSI: 58 (no overbought signal)                 │   │
│  │ • Positive news sentiment: +0.4                  │   │
│  │ • Uniswap TVL stable (+0.3% 24h)                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│              🛡️ RISK VALIDATOR               Round 1    │
│    ┌──────────────────────────────────────────────────┐ │
│    │ ❌ REJECTED — Range [2200-3000] has max IL of    │ │
│    │ 9.8% which exceeds your 7% limit. Position size │ │
│    │ 91% of portfolio is also over 70% limit.        │ │
│    │ ──────────────────────────────────────────────  │ │
│    │ • Concern 1: IL 9.8% > limit 7%                │ │
│    │ • Concern 2: Position size 91% > limit 70%     │ │
│    │ • Suggestion: Narrow range to [2400-2800]      │ │
│    └──────────────────────────────────────────────────┘ │
│                                                         │
│  🧠 STRATEGY PROPOSER                            Round 2│
│  ┌──────────────────────────────────────────────────┐   │
│  │ [REFINEMENT] Addressing both concerns:           │   │
│  │ Narrowed range to [2400-2800] → IL now 6.2% ✓   │   │
│  │ Reduced position to 60% of portfolio ✓          │   │
│  │ [TYPING...]                                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Message Types with Visual Treatment**:
- `proposal` — cyan left-aligned bubble
- `critique/rejection` — orange right-aligned bubble with ❌
- `refinement` — blue left-aligned bubble (slightly different shade than proposal)
- `concession` — yellow bubble ("I'm willing to accept...")
- `approval` — green bubble with ✅
- `agreement` — large gold banner ("Both agents reached consensus!")
- `final_decision` — purple banner from Nash Negotiator

**Hook**: `useAnalysis.ts` already polls status. Add `negotiationMessages` extraction.

**Sub-components**:
- `NegotiationMessageBubble.tsx` — single message with agent avatar + type badge
- `RoundSeparator.tsx` — "─── Round N ───" divider between rounds
- `NegotiationProgress.tsx` — shows "Round N of up to 10" progress bar
- `AgentStatusBadge.tsx` — shows which agent is currently "thinking"

---

### 5. Frontend Mock Data (for parallel development)

Use this mock when backend isn't ready:

```typescript
// lib/mock-data.ts
export const MOCK_NEGOTIATION_MESSAGES: NegotiationMessage[] = [
  {
    round: 1,
    from: 'StrategyProposer',
    type: 'proposal',
    content: 'Based on RSI at 58 and Fear & Greed at 65, I propose adding liquidity...',
    keyPoints: ['RSI: 58 (neutral)', 'Fear&Greed: 65 (Greed)', 'Expected APY: 22%'],
    timestamp: new Date()
  },
  {
    round: 1,
    from: 'RiskValidator',
    type: 'critique',
    content: 'Rejected: Range [2200-3000] has max IL of 9.8% exceeding 7% limit...',
    keyPoints: ['IL 9.8% > limit 7%', 'Position 91% > limit 70%'],
    timestamp: new Date()
  }
];
```

---

## New Files Summary

### Backend (New)
| File | Purpose |
|------|---------|
| `agents/src/tools/news-fetcher.ts` | NewsAPI integration |
| `agents/src/tools/fear-greed.ts` | Alternative.me F&G index |
| `agents/src/tools/defi-llama.ts` | DeFiLlama TVL data |
| `agents/src/tools/technical-analysis.ts` | RSI, MACD, Bollinger Bands |

### Backend (Rewrite)
| File | Change |
|------|--------|
| `agents/src/agents/market-analyzer.ts` | Full Gemini rewrite with 5 tools |
| `agents/src/agents/strategy-proposer.ts` | Gemini + round-aware prompts |
| `agents/src/agents/risk-validator.ts` | Gemini + critique generation |
| `agents/src/agents/negotiator.ts` | Gemini explanation + keep Nash formula |
| `agents/src/agents/data-collector.ts` | Multi-token via existing getMultiTokenPortfolio() |
| `agents/src/workflow.ts` | Conditional edges, 10-round loop |
| `agents/src/types/index.ts` | New types |
| `agents/src/index.ts` | New endpoints |
| `agents/src/utils/config.ts` | newsApiKey, fearGreedUrl, defiLlamaUrl |

### Frontend (New)
| File | Purpose |
|------|---------|
| `frontend/src/app/dashboard/page.tsx` | Main dashboard |
| `frontend/src/app/dashboard/settings/page.tsx` | Risk preferences |
| `frontend/src/app/dashboard/history/page.tsx` | Past analyses |
| `frontend/src/components/agents/NegotiationChamber.tsx` | Chat visualization |
| `frontend/src/components/agents/NegotiationMessageBubble.tsx` | Single message |
| `frontend/src/components/dashboard/PortfolioValueCard.tsx` | Portfolio value |
| `frontend/src/components/dashboard/TokenHoldingsTable.tsx` | Holdings table |
| `frontend/src/components/dashboard/MarketPulseBar.tsx` | F&G + prices |
| `frontend/src/components/dashboard/RecentAnalysesWidget.tsx` | Recent jobs |
| `frontend/src/components/dashboard/OnChainHistoryWidget.tsx` | Contract history |
| `frontend/src/components/settings/RiskPreferencesForm.tsx` | Settings form |
| `frontend/src/hooks/usePreferences.ts` | localStorage preferences |
| `frontend/src/lib/mock-data.ts` | Mock data for parallel development |

---

## Verification (End-to-End)

1. `cd agents && npm run dev` → backend starts on port 3001
2. `curl http://localhost:3001/api/market-overview` → returns F&G index, ETH price, Uniswap TVL
3. `curl -X POST http://localhost:3001/api/analyze -d '{"walletAddress":"0x...","preferences":{"maxImpermanentLoss":7}}'`
4. Poll status → watch `negotiationMessages` array grow with each round
5. Verify negotiation runs until either agreement OR 10 rounds
6. Verify agents cite actual data (RSI values, F&G index, news) not placeholder text
7. `cd frontend && npm run dev` → open dashboard
8. Connect MetaMask → dashboard shows real portfolio
9. Set risk preferences → start analysis → see negotiation chat animate in real-time
10. Click "Execute on Chain" → transaction logs to RebalanceLogger on Sepolia
