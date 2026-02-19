# FINAL FRONTEND IMPLEMENTATION PLAN - PHASE 2

## Architecture Overview

```
User Flow:
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Landing   │  →   │   Dashboard  │  →   │   Negotiation   │
│     (/)     │      │ (/dashboard) │      │   Theater       │
│             │      │              │      │   (/analyze)    │
│ - Hero      │      │ - Portfolio  │      │ - Round-by-     │
│ - Features  │      │ - Settings   │      │   round chat    │
│ - Connect   │      │ - Analyze    │      │ - Final results │
└─────────────┘      └──────────────┘      └─────────────────┘
```

---

## Priority 1: Core Dashboard Infrastructure (Day 1-2)

### 1.1 Landing Page Enhancement
**File**: `frontend/src/app/page.tsx`
- Remove wallet address input form
- Add "Connect Wallet" button (uses existing logic or simple state)
- On wallet connection → auto-redirect to `/dashboard`
- Keep hero section and feature cards

### 1.2 Type Definitions Update
**File**: `frontend/src/lib/types.ts`
- Add `UserPreferences` interface
- Add `NegotiationMessage` interface
- Add `DeepMarketAnalysis` interface (extending `MarketAnalysis`)
- Add `MarketOverviewResponse` interface
- Add `NewsItem` and `TechnicalIndicators` interfaces
- Update `StatusResponse` to include negotiation data

### 1.3 API Client Updates
**File**: `frontend/src/lib/api.ts`
- Add `startAnalysisWithPreferences` (POST /api/analyze with body)
- Add `getMarketOverview` (GET /api/market-overview)
- Update `getJobStatus` to extract negotiation data

### 1.4 Preferences Hook
**File**: `frontend/src/hooks/usePreferences.ts` (NEW)
- Manage `UserPreferences` state
- Load/Save to `localStorage` key `defi_user_preferences`
- Provide default values (Conservative/Moderate/Aggressive presets)

### 1.5 Dashboard Page Structure
**File**: `frontend/src/app/dashboard/page.tsx` (NEW)
- **Data Fetching**:
  - `useSWR` for `/api/portfolio/${address}` (30s refresh)
  - `useSWR` for `/api/market-overview` (60s refresh)
- **Layout**:
  - Top: `MarketPulseBar`
  - Left: `PortfolioValueCard` + `TokenHoldingsTable`
  - Right: `RiskPreferencesPanel`
  - Bottom: `StartAnalysisButton`

### 1.6 Dashboard Components
**Files**: `frontend/src/components/dashboard/` (NEW)
- `MarketPulseBar.tsx`: Fear & Greed gauge, ETH price, TVL
- `PortfolioValueCard.tsx`: Total value, 24h change
- `TokenHoldingsTable.tsx`: Top 5 tokens, expandable list
- `RiskPreferencesPanel.tsx`: Sliders for IL/Position, checkboxes for actions
- `StartAnalysisButton.tsx`: Glowing button to trigger analysis

---

## Priority 2: Negotiation Theater (Day 3-4)

### 2.1 Enhanced Analysis Page
**File**: `frontend/src/app/analyze/page.tsx`
- Receive `jobId` and `wallet` params
- Poll `/api/status/${jobId}` every 2 seconds
- Maintain local state for `negotiationMessages` and `currentRound`
- Render `NegotiationChamber`

### 2.2 Negotiation Chamber
**File**: `frontend/src/components/agents/NegotiationChamber.tsx` (NEW)
- Scrollable container for messages
- Auto-scroll to bottom
- Render `NegotiationProgress` (Round X of 10) at top

### 2.3 Message Bubbles
**File**: `frontend/src/components/agents/NegotiationMessageBubble.tsx` (NEW)
- Distinct styles for:
  - `proposal` (Cyan, Left)
  - `critique` (Orange, Right)
  - `refinement` (Blue, Left)
  - `concession` (Yellow, Left)
  - `agreement` (Green, Center)
  - `final_decision` (Purple, Center)
- Animations for entry

### 2.4 Supporting Components
- `RoundSeparator.tsx`: Visual divider
- `NegotiationProgress.tsx`: Progress bar
- `AgentTypingIndicator.tsx`: Animated dots

---

## Priority 3: Enhanced Results (Day 5)

### 3.1 Nash Explanation
**File**: `frontend/src/components/results/NashExplanationCard.tsx` (NEW)
- Display Gemini's 3-paragraph final explanation
- Show convergence stats

### 3.2 Enhanced Market Panel
**File**: `frontend/src/components/results/MarketAnalysisPanel.tsx` (MODIFY)
- Add News Headlines section
- Add Technical Indicators table (RSI, MACD, etc.)
- Add Gemini reasoning accordion

---

## Visual Style Guide
- **Theme**: Cyberpunk / Sci-Fi
- **Colors**:
  - Neon Cyan (`#00ffff`)
  - Neon Purple (`#bf00ff`)
  - Neon Orange (`#ff9900`)
  - Dark Background (`#0a0a0a` / `bg-bg-void`)
- **Fonts**:
  - Headings: Orbitron
  - Body/Code: JetBrains Mono
- **Effects**:
  - Glowing borders (`box-shadow`)
  - Glassmorphism (`backdrop-blur`)
  - Scanlines (optional)
