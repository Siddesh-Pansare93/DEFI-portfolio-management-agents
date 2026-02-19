# Autonomous DeFi - Frontend Implementation Plan

## Context

Backend is 100% complete (all 5 phases done, tested, running on port 3001). Now building the Next.js frontend to visualize the AI agent workflow for the final year project demo. The centerpiece is the **Agent Pipeline Theater** - a real-time visualization where each agent appears as a distinct glowing entity that activates, processes, and passes data to the next agent, making professors see the entire multi-agent system working.

**Key constraint:** The backend runs the entire LangGraph workflow atomically (all 5 agents complete before the status endpoint reveals results). A **visual timer** must simulate per-agent activation on the frontend while polling.

---

## Current Frontend State

- **Path**: `D:\development\siddesh\Autonomous-Defi\frontend`
- **Stack**: Next.js 16.1.6 (App Router), React 19, Tailwind CSS 4, TypeScript
- **shadcn already partially initialized**: `globals.css` imports `shadcn/tailwind.css` and `tw-animate-css`
- **Already installed**: `clsx`, `tailwind-merge`, `lucide-react`, `class-variance-authority`, `radix-ui`
- **Needs installation**: `framer-motion`, `recharts`, shadcn component files
- **Current pages**: only boilerplate `page.tsx` (no content yet)

---

## Design: Cyberpunk / Futuristic DeFi

### Color Palette
```css
/* Add to globals.css .dark block */
--neon-cyan:    #00ffff;   /* Data Collector */
--neon-blue:    #4488ff;   /* Market Analyzer */
--neon-yellow:  #ffee00;   /* Strategy Proposer */
--neon-orange:  #ff6600;   /* Risk Validator */
--neon-purple:  #aa00ff;   /* Nash Negotiator */
--neon-green:   #00ff88;   /* Success/approved */
--bg-void:      #020408;   /* Body background */
--bg-panel:     #080f1a;   /* Card background */
--bg-panel-2:   #0d1626;   /* Nested cards */
--grid-color:   rgba(0,255,255,0.05); /* Background grid lines */
```

### Typography
- **Headlines**: Orbitron (Google Fonts) - sci-fi uppercase with letter-spacing
- **Data/numbers/addresses**: JetBrains Mono (Google Fonts)
- **Body**: Geist Sans (already installed)

### Agent Identities
| Agent | Icon | Color | Activating Message |
|-------|------|-------|--------------------|
| Data Collector | `Database` | cyan | "Scanning Sepolia blockchain..." |
| Market Analyzer | `TrendingUp` | electric blue | "Analyzing 30-day price data..." |
| Strategy Proposer | `Lightbulb` | yellow | "Computing optimal DeFi strategy..." |
| Risk Validator | `Shield` | orange | "Validating risk parameters..." |
| Nash Negotiator | `Scale` | violet | "Computing Nash equilibrium..." |

---

## File Structure to Create

```
frontend/src/
├── app/
│   ├── layout.tsx              # Dark mode forced, Orbitron + JetBrains Mono fonts, CyberpunkBackground
│   ├── globals.css             # + cyberpunk CSS vars + keyframe animations
│   ├── page.tsx                # Landing page (REPLACE boilerplate)
│   └── analyze/
│       └── page.tsx            # Analysis page - THE centerpiece
│
├── components/
│   ├── ui/                     # shadcn generated (button, card, badge, progress, input, skeleton, accordion, tooltip, separator)
│   ├── layout/
│   │   ├── CyberpunkBackground.tsx   # Canvas particles + CSS grid background
│   │   ├── NavBar.tsx                # Top nav + live health indicator dot
│   │   └── GlowContainer.tsx        # Reusable neon-border wrapper
│   ├── landing/
│   │   ├── HeroSection.tsx           # Headline + wallet input form
│   │   └── WalletInput.tsx           # Input with neon glow + validation
│   ├── agents/
│   │   ├── AgentPipeline.tsx         # Container: 5 agents + connectors
│   │   ├── AgentNode.tsx             # Single agent (idle/active/complete states)
│   │   ├── AgentConnector.tsx        # Animated SVG data-flow line between agents
│   │   ├── AgentAvatar.tsx           # Spinning icon in active state (Framer Motion)
│   │   ├── AgentOutputPanel.tsx      # Collapsible data output when agent completes
│   │   └── TypingText.tsx            # Character-by-character typing animation
│   ├── charts/
│   │   ├── PortfolioDonut.tsx        # ETH/USDC allocation (Recharts PieChart)
│   │   ├── RiskGauge.tsx             # Semicircle gauge (Recharts RadialBarChart + SVG needle)
│   │   ├── ConfidenceMeter.tsx       # Vertical animated bar (Framer Motion)
│   │   └── NashBargainingViz.tsx     # XY scatter: safety vs return utility (Recharts)
│   ├── results/
│   │   ├── FinalRecommendationCard.tsx  # Big colored card - action + APY + confidence
│   │   ├── PortfolioSnapshot.tsx        # ETH + USDC balance cards
│   │   ├── MarketAnalysisPanel.tsx      # Trend badge + volatility + reasoning
│   │   ├── StrategyDetailsPanel.tsx     # LP range / swap amounts / hold msg
│   │   ├── RiskValidationPanel.tsx      # Risk score + violations list
│   │   └── WorkflowSummary.tsx          # Accordion of all 5 agent outputs (for professors)
│   └── shared/
│       ├── NeonBadge.tsx               # Colored pill badge with CSS glow
│       ├── CountUpNumber.tsx           # Animated number counter (Framer Motion)
│       └── DataRow.tsx                 # Label + value row
│
├── hooks/
│   ├── useAnalysis.ts           # POST /api/analyze + polling every 2s
│   ├── useAgentProgress.ts      # Derives per-agent status + visual timer simulation
│   └── useTypingAnimation.ts    # char-by-char text reveal hook
│
└── lib/
    ├── api.ts                   # All fetch wrappers for backend endpoints
    ├── types.ts                 # Mirror of agents/src/types/index.ts
    ├── constants.ts             # AGENT_DEFINITIONS array (name, icon, color, message)
    └── utils.ts                 # formatUSD(), formatAddress(), formatPercent()
```

---

## Critical Architecture: Polling + Visual Timer

The backend status endpoint (`GET /api/status/:jobId`) returns:
- During analysis: `{status: "analyzing", currentAgent: "Data Collector", progress: 0, workflowState: {...nulls}}`
- On complete: `{status: "complete", result: {...}, workflowState: {portfolio, marketAnalysis, ...all filled}}`

Since `workflowState` fields only populate when ALL agents finish, the UI must simulate visual progression:

```typescript
// useAgentProgress.ts - CRITICAL LOGIC
// Visual timer: advance active agent every 9s (47s total / 5 agents)
// Real completion: check workflowState fields (portfolio != null, etc.)
// Real data OVERRIDES visual timer when available

const COMPLETION_CHECKS = {
  'Data Collector':    (ws) => ws?.portfolio !== null,
  'Market Analyzer':   (ws) => ws?.marketAnalysis !== null,
  'Strategy Proposer': (ws) => ws?.strategyProposal !== null,
  'Risk Validator':    (ws) => ws?.riskValidation !== null,
  'Nash Negotiator':   (ws) => ws?.finalRecommendation !== null,
};
```

### URL State (Professor Demo Feature)
Analysis page uses query params: `/analyze?wallet=0x...&job=job_123`
- On mount, if `job` param exists → start polling immediately (no re-submit)
- Completed jobs load instantly → professors can reload without losing results

---

## Implementation Phases

### Phase 1: Foundation & Theme (2 hours)
**Goal**: Cyberpunk aesthetic working before any features

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install framer-motion recharts
   npx shadcn@latest add button card badge progress input separator tooltip skeleton accordion
   ```
2. **Extend `globals.css`**: Add all `--neon-*` and `--bg-*` CSS variables to `.dark` block; add keyframe animations (`neon-pulse`, `scanline`, `grid-pulse`)
3. **Update `layout.tsx`**: Force `className="dark"` on `<html>`; add Orbitron + JetBrains Mono from `next/font/google`; mount `CyberpunkBackground`
4. **Build `CyberpunkBackground.tsx`**: Full-screen fixed `<div>` with CSS grid background + `<canvas>` running 80-particle animation loop
5. **Build `GlowContainer.tsx`**, `NeonBadge.tsx`, `CountUpNumber.tsx`
6. **Build `NavBar.tsx`** with health check dot pinging `GET /health` every 30s

**Verification**: `npm run dev` → page looks cyberpunk with animated particles

---

### Phase 2: Landing Page + API Layer (2 hours)
**Goal**: User can submit wallet address and trigger analysis

1. **Create `lib/types.ts`**: Copy all interfaces from `agents/src/types/index.ts` verbatim
2. **Create `lib/constants.ts`**: Define `AGENT_DEFINITIONS` array with name, icon component, color var, activating message, completion field name
3. **Create `lib/api.ts`**: Implement `startAnalysis(walletAddress)`, `pollStatus(jobId)`, `getPortfolio(address)` using `fetch`
4. **Create `lib/utils.ts`**: `formatUSD()`, `formatAddress()`, `formatPercent()`, `formatAPY()`
5. **Create `hooks/useAnalysis.ts`**: Full implementation with `setInterval` polling, phase state machine (`idle → starting → polling → complete | error`), cleanup on unmount
6. **Create `hooks/useAgentProgress.ts`**: Visual timer + real data override logic
7. **Build `WalletInput.tsx`**: shadcn `<Input>` with neon glow on focus, validation (0x + 42 chars), error state; on submit calls `startAnalysis` then `router.push('/analyze?wallet=X&job=Y')`
8. **Rewrite `app/page.tsx`**: Hero with "AUTONOMOUS DEFI INTELLIGENCE" headline, subtitle, `WalletInput`, background feature cards

**Verification**: Enter wallet → redirected to `/analyze` page with jobId in URL

---

### Phase 3: Agent Pipeline Theater (4 hours)
**Goal**: THE centerpiece - 5 agents animating in real-time

1. **Build `hooks/useTypingAnimation.ts`**: `setInterval` revealing chars; returns displayed string + boolean cursor
2. **Build `TypingText.tsx`**: Renders typing string with blinking `|` cursor
3. **Build `AgentAvatar.tsx`**: Framer Motion `animate={{ rotate: 360 }}` with `repeat: Infinity` when active; swap to checkmark icon when complete
4. **Build `AgentConnector.tsx`**: SVG line with animated `stroke-dashoffset` particles flowing along path when downstream agent is active
5. **Build `AgentNode.tsx`** with 3 states:
   - `idle`: dark card, dim icon, greyed name
   - `active`: pulsing neon border (`neon-pulse` keyframe), spinning `AgentAvatar`, `TypingText` showing activating message, "PROCESSING" `NeonBadge`
   - `complete`: solid border in agent color, checkmark, `AgentOutputPanel` (collapsible)
6. **Build `AgentOutputPanel.tsx`**: Shows relevant slice of `workflowState` formatted with `DataRow`; each numeric value uses `CountUpNumber`
7. **Build `AgentPipeline.tsx`**: Horizontal row on `md+`, vertical on mobile; uses `useAgentProgress` to distribute status to each node; includes top `<Progress>` bar showing `progress * 100`
8. **Create `app/analyze/page.tsx`**: Reads `wallet` + `job` from searchParams; instantiates `useAnalysis` hook; renders `AgentPipeline`; shows results section below when `phase === 'complete'`

**Verification**: Start real analysis → watch 5 agents light up in sequence over ~47 seconds

---

### Phase 4: Results & Charts (3 hours)
**Goal**: Full data visualization after analysis completes

1. **Build `PortfolioDonut.tsx`**: Recharts `PieChart` with ETH (cyan) + USDC (pink) segments; center label with `CountUpNumber` for total USD; wrapped in `GlowContainer`
2. **Build `RiskGauge.tsx`**: Recharts `RadialBarChart` as 180° semicircle; SVG needle pointer at risk score value; color label (LOW/MEDIUM/HIGH RISK)
3. **Build `ConfidenceMeter.tsx`**: Framer Motion `animate={{ height: value% }}` vertical bar; confidence % shown with `CountUpNumber`
4. **Build `NashBargainingViz.tsx`**: Recharts `ScatterChart` with X = safety utility, Y = return utility; Nash equilibrium point as glowing dot; "disagreement point" at origin with dashed line (great for professor explanation)
5. **Build `FinalRecommendationCard.tsx`**: Background tinted by action (`add_liquidity`=cyan, `swap`=yellow, `hold`=purple); large action text; APY, max risk, confidence with `CountUpNumber`; pulsing border on mount; "EXECUTE ON CHAIN" button (demo only)
6. **Build `PortfolioSnapshot.tsx`**, `MarketAnalysisPanel.tsx`, `StrategyDetailsPanel.tsx`, `RiskValidationPanel.tsx`, `WorkflowSummary.tsx`
7. **Wire results into `/analyze/page.tsx`**: Results section uses `AnimatePresence` to slide up from below when `phase === 'complete'`; `WorkflowSummary` accordion at bottom for professors

**Verification**: End-to-end: enter wallet → agents animate → results appear with all charts

---

### Phase 5: Wallet Connection + On-Chain Logging (2 hours)
**Goal**: "Execute on Chain" button actually submits to RebalanceLogger contract

**Contract deployed**: `0x4F3DD9522c2d1B240365516a46250226e4eB7B3B` (Sepolia)
**Functions**: `logRecommendation(action: string, details: string)` → emits `RecommendationLogged` event

1. **Install wallet libraries**:
   ```bash
   npm install wagmi viem @tanstack/react-query
   ```
2. **Create `lib/wagmi-config.ts`**: Configure wagmi with Sepolia chain + MetaMask connector
3. **Create `components/wallet/WalletConnectButton.tsx`**: Button that connects MetaMask; shows truncated address when connected
4. **Add wagmi + QueryClient providers** to `app/layout.tsx`
5. **Create `hooks/useLogRecommendation.ts`**: Uses wagmi `useWriteContract` to call `logRecommendation(action, JSON.stringify(details))`
6. **Update `FinalRecommendationCard.tsx`**: "Execute on Chain" button → triggers wallet connection if not connected, then calls contract, shows tx hash with Sepolia Etherscan link
7. **Add `WalletConnectButton`** to `NavBar.tsx`

**Execute Flow**:
```
Click "Execute on Chain"
  → If not connected: open MetaMask connection modal
  → If connected: call RebalanceLogger.logRecommendation(action, detailsJSON)
  → Show "Submitting to Sepolia..." spinner
  → On success: show tx hash as neon link to sepolia.etherscan.io
  → Show "LOGGED ON-CHAIN ✓" badge on FinalRecommendationCard
```

### Phase 6: Polish & Professor Mode (1 hour)
**Goal**: Demo-ready, error-handled, impressive

1. Add error state UI in `/analyze` page (red neon error card if workflow fails)
2. Add `<Skeleton>` loading states while analysis starts
3. Add scanline CSS overlay for CRT effect (subtle, adds to aesthetic)
4. Make all charts animate on entrance with Framer Motion `initial={{ opacity: 0 }}` stagger
5. Add `WorkflowSummary` accordion prominently - label it "FULL AGENT TRACE" for professors
6. Test keyboard: `Enter` in wallet input submits
7. Quick responsiveness check: `AgentPipeline` vertical on mobile
8. Final glow/color tuning pass

---

## Key Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/globals.css` | **Edit** | Add cyberpunk CSS vars and keyframes to existing `.dark` block |
| `frontend/src/app/layout.tsx` | **Replace** | Add fonts, dark class, CyberpunkBackground |
| `frontend/src/app/page.tsx` | **Replace** | Full landing page (delete boilerplate) |
| `frontend/src/app/analyze/page.tsx` | **Create** | Main analysis page |
| `frontend/src/lib/types.ts` | **Create** | Mirror of `agents/src/types/index.ts` |
| `frontend/src/lib/api.ts` | **Create** | Backend fetch wrappers |
| `frontend/src/hooks/useAnalysis.ts` | **Create** | Polling state machine |
| `frontend/src/hooks/useAgentProgress.ts` | **Create** | Visual timer + agent status derivation |
| `frontend/src/components/agents/AgentPipeline.tsx` | **Create** | Core visual component |
| All `components/ui/*` files | **Generate** | via `npx shadcn add` command |

---

## External Dependencies to Install

```bash
cd frontend
npm install framer-motion recharts wagmi viem @tanstack/react-query
# Then generate shadcn components:
npx shadcn@latest add button card badge progress input separator tooltip skeleton accordion
```

(Note: `clsx`, `tailwind-merge`, `lucide-react`, `radix-ui` already installed)

## Contract Integration Details

**RebalanceLogger** deployed at `0x4F3DD9522c2d1B240365516a46250226e4eB7B3B` on Sepolia
**ABI for frontend** (minimal - only what we need):
```typescript
const REBALANCE_LOGGER_ABI = [
  {
    name: 'logRecommendation',
    type: 'function',
    inputs: [
      { name: 'action', type: 'string' },
      { name: 'details', type: 'string' }
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
  }
] as const;
```
**Call**: `writeContract({ address: CONTRACT_ADDRESS, abi: REBALANCE_LOGGER_ABI, functionName: 'logRecommendation', args: [result.action, JSON.stringify(result.details)] })`

---

## API Integration Summary

```
Base URL: http://localhost:3001

POST /api/analyze         → {jobId, status, statusUrl}
GET  /api/status/:jobId   → {status, progress(0-1), currentAgent, workflowState, result}
GET  /api/portfolio/:addr → {totalValue, holdings: {ETH, USDC}, timestamp}
GET  /health              → {status: "healthy"}
```

**Poll frequency**: 2000ms intervals, stop on `status === "complete"` or `status === "error"`

---

## Phase Summary

| Phase | Focus | Time |
|-------|-------|------|
| 1 | Foundation: cyberpunk theme, shadcn, background, fonts | 2h |
| 2 | Landing page + API hooks + routing | 2h |
| 3 | Agent Pipeline Theater (the centerpiece animation) | 4h |
| 4 | Results charts + recommendation card | 3h |
| 5 | Wallet connection + on-chain logging (wagmi + contract) | 2h |
| 6 | Polish, error handling, professor mode | 1h |
| **Total** | | **~14h** |

---

## Verification (End-to-End Test)

1. Start backend: `cd agents && npm run dev` (port 3001)
2. Start frontend: `cd frontend && npm run dev` (port 3000)
3. Open `http://localhost:3000` - should see cyberpunk landing page with particles
4. Enter a valid Sepolia wallet address (e.g. `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4`)
5. Click "Initiate Analysis" → redirected to `/analyze?wallet=X&job=Y`
6. Watch 5 agents light up one-by-one over ~47 seconds with typing animations
7. After completion, see `FinalRecommendationCard`, portfolio donut, risk gauge, Nash viz slide in
8. Expand "FULL AGENT TRACE" accordion to see all agent reasoning text
9. Copy the `/analyze?wallet=X&job=Y` URL, open in new tab → results load instantly (bookmarkable)
10. Connect MetaMask → click "Execute on Chain" → approve tx → see Sepolia Etherscan link
