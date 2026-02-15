# Portfolio Analysis Flow

## High-level flow

1. **USER ACTION:** Clicks "Analyze Portfolio" button
2. **FRONTEND:** Reads wallet address from MetaMask (e.g., `0xABC...123`)
3. **FRONTEND:** Calls `POST /api/analyze` with `{ "walletAddress": "0xABC...123" }`
4. **BACKEND:** Receives request, starts LangGraph workflow
5. **BACKEND:** Returns `STATE.finalRecommendation` to frontend
6. **FRONTEND:** Displays recommendation + builds unsigned transaction
7. **USER:** Reviews and clicks "Execute"
8. **FRONTEND:** Sends transaction to MetaMask for signature
9. **METAMASK:** User approves, signs transaction
10. **BLOCKCHAIN:** Transaction executes on Sepolia
11. **FRONTEND:** Shows success message + updated portfolio

---

## LangGraph workflow (sequential)

**Initial state:**

```json
{
  "walletAddress": "0xABC...123",
  "portfolio": null,
  "marketData": null,
  "analysis": null,
  "proposal": null,
  "riskCheck": null,
  "finalRecommendation": null
}
```

---

### Agent 1: Data Collection Agent

**Tools:**

- **BalanceReader** → Reads ETH, USDC from wallet
- **PriceFetcher** → Gets ETH/USD, USDC/USD prices
- **PoolDataFetcher** → Gets Uniswap ETH-USDC stats

**LLM prompt:**

> You are a data specialist. For wallet `{address}`, fetch current holdings and market prices. Use the BalanceReader, PriceFetcher, and PoolDataFetcher tools. Return JSON.

**Output** (added to `STATE.portfolio`):

```json
{
  "holdings": {
    "ETH": { "balance": 0.5, "valueUSD": 1000 },
    "USDC": { "balance": 1500, "valueUSD": 1500 }
  },
  "totalValueUSD": 2500
}
```

---

### Agent 2: Market Analyzer Agent

**Tools:**

- **PriceHistoryFetcher** → Gets 30-day ETH prices
- **VolatilityCalculator** → Computes price volatility

**LLM prompt:**

> You are a market analyst. Given current portfolio `{portfolio}` and price history, analyze:
> 1. Is ETH trending up or down?
> 2. What's the volatility (risky vs stable)?
> 3. Should we increase or decrease ETH exposure?
> Return JSON with sentiment and reasoning.

**Output** (added to `STATE.analysis`):

```json
{
  "ethSentiment": "bullish",
  "volatility": 0.35,
  "recommendation": "increase_eth_exposure",
  "reasoning": "ETH up 15% in 30 days, momentum suggests continued growth"
}
```

---

### Agent 3: Strategy Agent

**Tools:**

- **YieldEstimator** → Estimates Uniswap LP APY
- **AllocationOptimizer** → Suggests % split

**LLM prompt:**

> You are a portfolio strategist. Given:
> - Portfolio: `{portfolio}`
> - Analysis: `{analysis}`
> Propose a rebalanced allocation. Options:
> 1. Swap some USDC to ETH (increase ETH %)
> 2. Add liquidity to Uniswap ETH-USDC pool
> 3. Keep current allocation
> Consider expected yield vs risk. Return JSON.

**Output** (added to `STATE.proposal`):

```json
{
  "action": "add_liquidity",
  "details": {
    "poolAddress": "0xUniswapETH-USDC",
    "ethAmount": 0.3,
    "usdcAmount": 600,
    "priceRange": { "lower": 1800, "upper": 2200 }
  },
  "expectedAPY": 0.18,
  "reasoning": "Uniswap LP offers 18% APY. Given bullish ETH sentiment, narrow range captures fees while limiting IL."
}
```

*Note: `ethAmount: 0.3` = 60% of current ETH.*

---

### Agent 4: Risk Checker Agent

**Tools:**

- **ImpermanentLossCalculator** → Estimates max IL
- **ConstraintChecker** → Validates hard limits

**LLM prompt:**

> You are a risk manager. Evaluate this proposal: `{proposal}`. Check:
> 1. Max impermanent loss < 10%
> 2. No single asset > 70% of portfolio
> 3. Price range not too narrow (>10% width)
> If violations, suggest safer version. Return JSON.

**Output** (added to `STATE.riskCheck`):

```json
{
  "approved": true,
  "estimatedMaxIL": 0.08,
  "violations": [],
  "adjustedProposal": null,
  "riskScore": 0.75
}
```

*Note: `estimatedMaxIL: 0.08` = 8% max IL; `riskScore`: 0 = safe, 1 = risky.*

---

### Negotiator (deterministic — no LLM)

JavaScript function that combines:

- **Strategy utility** = `expectedAPY` (0.18)
- **Risk utility** = `1 - riskScore` (0.25)

**Nash bargaining logic:**

| Condition | Result |
|-----------|--------|
| Both utilities > 0.5 | Accept strategy proposal |
| Risk too high (utility < 0.3) | Use risk-adjusted version |
| Else | Weighted blend (70% strategy, 30% safety) |

**Output** (added to `STATE.finalRecommendation`):

```json
{
  "action": "add_liquidity",
  "params": {},
  "confidence": 0.82,
  "explanation": "Adding liquidity to Uniswap offers 18% APY with acceptable 8% IL risk."
}
```

*Note: `params` same as proposal.*
