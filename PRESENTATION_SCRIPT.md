# Autonomous DeFi — Presentation Script

> Two presenters: **Person A** and **Person B**
> Total time: ~15-20 minutes
> Rule: NO mention of GenAI, Gemini, or LLMs. Present everything as our own built system.

---

## OPENING (Person A) — 2 min

"Good morning everyone. Today we are presenting **Autonomous DeFi** — a multi-agent system that autonomously manages DeFi portfolios on Ethereum.

The problem we are solving is simple. DeFi — Decentralized Finance — offers incredible yield opportunities through protocols like Uniswap. But the average user has no idea when to provide liquidity, what price range to set, or how much risk they are taking. They either do nothing, or they make emotional decisions and lose money.

Our solution: **5 specialized AI agents that work together** — they collect data, analyze markets, propose strategies, validate risks, and then use **game theory** to reach a final decision. The entire process is transparent — you can watch the agents debate in real-time — and the final recommendation is executed **on-chain** through a smart contract.

Let me hand it over to [Person B] to walk you through how the system actually works."

---

## SYSTEM ARCHITECTURE (Person B) — 3 min

"Thank you. Let me explain the architecture.

Our system has three layers:

**Layer 1: Data Layer** — We connect to multiple external data sources:
- **Ethereum blockchain** via Alchemy RPC to read wallet balances
- **CoinGecko API** for real-time token prices (we track 25 tokens)
- **The Graph Protocol** for Uniswap V3 pool statistics — liquidity, volume, fees
- **DefiLlama** for total value locked across protocols
- **Fear & Greed Index** for market sentiment

**Layer 2: Agent Layer** — This is the core. We have 5 agents arranged in a pipeline. Each agent has a specific job, specific mathematical tools, and specific inputs/outputs. They execute sequentially — each agent reads the previous agent's output and adds its own analysis. We built this using **LangGraph** — a state graph framework that manages the flow of data between agents.

**Layer 3: Execution Layer** — Once the agents reach a decision, it gets logged on the Ethereum Sepolia blockchain through our **RebalanceLogger smart contract**. This is a real Solidity contract deployed on-chain. The user confirms the transaction through MetaMask, and the strategy is permanently recorded.

The frontend shows all of this in real-time — you can watch each agent activate, see their reasoning, and observe the negotiation between agents.

Now let me explain each agent in detail."

---

## AGENT 1: DATA COLLECTOR (Person B) — 2 min

"The first agent is the **Data Collector**. Its job is simple but critical — gather all the raw data we need.

It fetches:
- ETH and USDC balances from the blockchain using **ethers.js**
- Current token prices from CoinGecko
- Uniswap V3 pool metrics — total liquidity, 24-hour trading volume, and fee revenue

Then it calculates the portfolio composition:

```
Total Value = (ETH Balance × ETH Price) + (USDC Balance × USDC Price)
ETH Allocation = (ETH Value / Total Value) × 100%
```

It also calculates the **pool fee APR**:

```
Fee APR = (Daily Fees / Total Liquidity) × 365
```

This tells us how much yield the Uniswap pool is generating. This data feeds into every subsequent agent."

---

## AGENT 2: MARKET ANALYZER (Person A) — 3 min

"The second agent is the **Market Analyzer**. This is where the serious mathematics begins.

It takes the 30-day price history and calculates three things:

**1. Annualized Volatility**

We calculate how much the price fluctuates using standard deviation:

```
Mean Price = Sum of all prices / Number of days
Variance = Sum of (Price - Mean)² / Number of days
Std Deviation = Square root of Variance
Annualized Volatility = (Std Dev / Mean) × √365 × 100
```

If volatility is below 15%, we classify the market as **stable**. Above 35%, it is **volatile**. This directly affects how wide our Uniswap price range should be.

**2. Trend Detection**

We calculate the 30-day price change:

```
Price Change = ((Current Price - 30-day Average) / 30-day Average) × 100
```

If it is above +5%, the trend is **bullish**. Below -5%, it is **bearish**. Otherwise, **neutral**.

**3. Market Recommendation**

Based on the combination of trend and volatility, the agent outputs one of three recommendations:
- **Increase ETH** — bullish trend + stable market
- **Decrease ETH** — bearish trend + volatile market
- **Maintain** — everything else

This recommendation drives the strategy agent's decision."

---

## AGENT 3: STRATEGY PROPOSER (Person B) — 3 min

"The third agent is the **Strategy Proposer**. Based on the portfolio composition and market analysis, it proposes one of three actions:

**Action 1: Add Liquidity** — This is the primary DeFi strategy. We provide tokens to the Uniswap V3 pool and earn trading fees.

The key calculation here is the **optimal price range**. Uniswap V3 uses concentrated liquidity — you earn fees only when the price is within your range. Too narrow = more fees but higher risk. Too wide = safer but less yield.

We calculate it using volatility:

```
Range Width = (Volatility / 100) × 1.5
Lower Price = Current Price × (1 - Range Width)
Upper Price = Current Price × (1 + Range Width)
```

We cap the downward range at 90% so the lower price never goes negative.

Then we convert these prices to **Uniswap V3 ticks** — the internal unit Uniswap uses:

```
Tick = log(Price) / log(1.0001)
```

Rounded to the nearest tick spacing of 60, which corresponds to the 0.3% fee tier.

**Position sizing**: We allocate 50% of the portfolio to the LP position, split equally between ETH and USDC. We never use more than 80% of any single token.

**APY estimation**:

```
Daily Earnings = (Position Size / Pool Liquidity) × Daily Pool Fees
Annual Earnings = Daily Earnings × 365
Estimated APY = (Annual Earnings / Position Size) × 100
```

**Action 2: Swap** — Only triggered when the market is strongly bearish AND the portfolio is over 80% concentrated in ETH. We swap to bring ETH allocation down to 40%.

**Action 3: Hold** — The fallback when conditions are uncertain."

---

## AGENT 4: RISK VALIDATOR (Person A) — 3 min

"The fourth agent is the **Risk Validator**. This is the safety gate. No strategy gets executed without passing three risk checks.

**Check 1: Impermanent Loss**

This is the biggest risk in DeFi liquidity provision. When you provide liquidity, if the price moves significantly, you end up with less value than if you had just held. We calculate the worst-case IL using the standard formula:

```
IL = 2 × √(Price Ratio) / (1 + Price Ratio) - 1
```

For example, if the price doubles (ratio = 2):
```
IL = 2 × √2 / (1 + 2) - 1 = 2 × 1.414 / 3 - 1 = -0.0572 = 5.72% loss
```

We calculate IL at both boundaries of our price range and take the maximum. If it exceeds **10%**, the strategy is rejected.

**Check 2: Position Concentration**

No single position should exceed **70% of the total portfolio**. This ensures the user always has reserves.

**Check 3: Volatility Threshold**

If market volatility exceeds our safe threshold, that is flagged as an additional risk factor.

**Risk Score Calculation:**

We combine these into a single risk score between 0 and 1:

```
IL Risk = min(Max IL / 20, 1)
Volatility Risk = min(Volatility / 100, 1)
Risk Score = (IL Risk × 0.5) + (Volatility Risk × 0.5)
```

Capped at 0.65 maximum.

If any check fails, the Risk Validator generates a **safer alternative** — it reduces the position size by 50% and widens the price range by 50%. Then it sends this back for negotiation."

---

## AGENT 5: NASH NEGOTIATOR (Person B) — 3 min

"The fifth and final agent is the **Nash Negotiator**. This is where we apply game theory to make the final decision.

The core concept is the **Nash Bargaining Solution** — a game theory framework where two players with conflicting interests find an optimal agreement.

In our system, the two 'players' are:
- **Return** — wants maximum yield
- **Safety** — wants minimum risk

We calculate a **utility** for each:

```
Return Utility = min(Expected APY / 30%, 1)
Safety Utility = 1 - Risk Score
```

Then we apply three decision rules:

**Rule 1: Both Satisfied**
If the strategy is approved AND Return Utility > 0.10 AND Safety Utility > 0.60:
→ Accept the original strategy
→ Confidence = Return Utility × Safety Utility (the **Nash product**)

This is the actual Nash Bargaining Solution — the point that maximizes the product of both utilities. It is mathematically proven to be the unique optimal agreement.

**Rule 2: Too Risky**
If the strategy was rejected OR Safety Utility < 0.40:
→ Use the risk-adjusted strategy (safer version)
→ Confidence = 0.3 + (Safety × 0.5) + (Return × 0.3), floored at 55%

**Rule 3: Moderate Conflict**
For everything in between:
→ Blend both strategies with weighted average
→ Weight toward safety: 60% safety, 40% return

The output is a final recommendation with an **action**, **expected APY**, **maximum risk**, and a **confidence score** — all mathematically derived, fully transparent, fully reproducible."

---

## NEGOTIATION PROCESS (Person A) — 2 min

"What makes our system unique is the **multi-round negotiation**. This is not a single pass — the Strategy Proposer and Risk Validator go back and forth for **8 rounds**.

Round 1-2: Strategy proposes an aggressive approach. Risk Validator rejects it — too much IL, too much concentration.

Round 3-4: Strategy comes back with a refined proposal. Tighter range, smaller position. Risk Validator sees improvement but asks for more — wants a rebalance trigger, lower allocation.

Round 5-6: Strategy accepts the feedback. Final parameters are set. Risk Validator approves.

Round 7: Consensus confirmed. Both agents agree.

Round 8: Nash Negotiator makes the final decision using the utility calculations.

You can watch this entire debate happen in real-time on our frontend. Each message shows the agent's reasoning, and you can see how the strategy evolves through negotiation. This is fundamentally different from a system that just gives you an answer — our system **shows you how it arrived at that answer**."

---

## LIVE DEMO (Person A + Person B) — 4 min

"Now let us show you the system in action.

**[Person A opens the browser]**

This is our landing page. You can see the neural network visualization in the background — each node represents one of our 5 agents. The connecting lines show data flow between them.

**[Person A enters demo wallet address]**

We enter a wallet address and land on the **Command Center** — our dashboard. You can see:
- Real-time market data: ETH price, Fear & Greed index, Uniswap TVL
- Portfolio holdings: 15 ETH, 4200 USDC, LINK, UNI, AAVE and more
- A live market feed with real events
- All 5 agents showing 'Ready' status
- Risk preferences: we will go with Moderate

**[Person B clicks Start AI Analysis]**

Watch the brain icon assemble — that is our Jarvis-inspired animation.

Now we are on the analysis page. Watch the neural network — each agent activates in sequence:

1. Data Collector lights up — you can see it scanning token contracts
2. Market Analyzer — computing volatility, RSI, MACD
3. Strategy Proposer — calculating optimal Uniswap range
4. Risk Validator — running impermanent loss simulation

Now watch the negotiation — Strategy proposes aggressive, Risk rejects, they go back and forth. 8 rounds of debate.

5. Nash Negotiator — computing the Nash equilibrium

**[Results appear]**

Final recommendation: **Add Liquidity** with 8.5% APY, 35% risk score, 72% confidence.

Below you see:
- Portfolio allocation donut chart
- Risk gauge showing the score
- Nash Bargaining visualization — the exact point where return and safety utilities are optimized
- Historical backtest: if we followed this strategy 30 days ago, we would have gained +12.3% vs ETH hold at +4.8%

**[Person A clicks Execute On-Chain]**

MetaMask opens — this is a **real transaction** on Ethereum Sepolia. We confirm it.

Transaction confirmed. Here is the Etherscan link — the strategy recommendation is now permanently recorded on the Ethereum blockchain. Immutable, verifiable, transparent.

That is Autonomous DeFi."

---

## CLOSING (Person B) — 1 min

"To summarize what we have built:

1. **5 specialized agents** — each with specific mathematical tools and clear responsibilities
2. **Game theory decision-making** — Nash Bargaining Solution for optimal risk-return balance
3. **Real-time transparency** — watch agents think, debate, and decide
4. **On-chain execution** — strategies verified and recorded on Ethereum
5. **Risk-first approach** — no strategy executes without passing 3 independent risk checks

The key takeaway: this is not a system that gives you a magic answer. It is a system that **shows you the mathematics behind every decision**, lets you watch the agents negotiate, and then executes with full transparency on a public blockchain.

Thank you. We are happy to take questions."

---

## EXPECTED QUESTIONS & ANSWERS

**Q: Why 5 agents? Why not one?**
A: "Separation of concerns. Each agent is an expert in its domain. The Data Collector only collects data — it does not make decisions. The Risk Validator only validates — it does not propose. This specialization means each agent can be independently tested, and the negotiation between them prevents any single point of failure."

**Q: What is the Nash Bargaining Solution?**
A: "It is a game theory concept by John Nash. When two players negotiate, the Nash solution is the unique point that maximizes the product of their utilities. In our case, Confidence = Return Utility × Safety Utility. This mathematically guarantees the most balanced outcome."

**Q: How is impermanent loss calculated?**
A: "Using the standard DeFi formula: IL = 2√r / (1+r) - 1, where r is the price ratio. If ETH doubles, you lose 5.72% compared to just holding. We calculate this at both ends of the price range and take the worst case."

**Q: Why Uniswap V3 specifically?**
A: "V3 introduced concentrated liquidity — you choose a price range. This means higher capital efficiency and higher fees, but also higher risk if the price moves out of range. Our system calculates the optimal range based on historical volatility."

**Q: How do you decide the price range?**
A: "Range = Volatility × 1.5. So if 30-day volatility is 40%, the range extends 60% above and below current price. Higher volatility = wider range = safer but lower yield. It is a mathematical trade-off."

**Q: Is the on-chain execution real?**
A: "Yes. We have a Solidity smart contract deployed on Sepolia testnet. When you click Execute, MetaMask opens, you sign a real transaction, and the recommendation is permanently stored on Ethereum. You can verify it on Etherscan."

**Q: What happens if all agents disagree?**
A: "That cannot happen by design. The agents execute sequentially — each one builds on the previous. The negotiation happens specifically between Strategy Proposer and Risk Validator. If they cannot agree after 8 rounds, the Nash Negotiator forces a decision using utility mathematics."

**Q: How is this different from just using ChatGPT?**
A: "Three ways. First, we use real blockchain data — actual wallet balances, real pool statistics, live prices. Second, our decisions are mathematical — impermanent loss formulas, volatility calculations, Nash equilibrium — not text generation. Third, we actually execute on-chain. ChatGPT gives advice. Our system takes action."

**Q: What is the diversification score?**
A: "We use the Herfindahl-Hirschman Index — the same formula used in economics to measure market concentration. We square each token's allocation percentage and sum them. Lower HHI = more diversified. We normalize it to a 0-1 score."





image.png