# UI Design Spec: "Neural Glass" — The Final Design

> Hybrid of Neural Network visualization + Liquid Glass premium feel
> Pure black. Glowing nodes. Data flowing like synapses. Glass cards. Premium.

---

## 1. GLOBAL FOUNDATION

### 1.1 Background
```
Base:        #050505 (near-black, NOT pure #000000 — avoids OLED smearing)
Gradient:    radial-gradient from center — #050505 to #020208 (very subtle blue-black at edges)
```

**Ambient Layer** (behind everything, z-0):
- 3 large gradient blobs, heavily blurred (filter: blur(120px)):
  - Blob 1: Indigo (#4F46E5 at 6% opacity), top-left area, 600px wide
  - Blob 2: Emerald (#10B981 at 4% opacity), bottom-right area, 500px wide  
  - Blob 3: Amber (#F59E0B at 3% opacity), center-bottom, 400px wide
- All blobs animate with slow drift (20-30s cycle, subtle translateX/Y oscillation)
- Purpose: Adds atmospheric depth without being noticeable. The page feels "alive" but you can't point at why.

**Subtle Grid** (z-1, on landing page only):
- CSS grid pattern: 1px lines at 80px spacing
- Color: rgba(255, 255, 255, 0.02) — barely visible, like graph paper
- Fades out at edges using radial gradient mask
- Purpose: Makes the landing feel technical/scientific

### 1.2 Colors
```
Backgrounds:
  --bg-deep:        #050505     (page background)
  --bg-card:        #0A0A0F     (card surfaces)
  --bg-elevated:    #111118     (hover states, elevated surfaces)
  --bg-glass:       rgba(255, 255, 255, 0.03)   (frosted glass cards)
  --bg-glass-hover: rgba(255, 255, 255, 0.06)   (glass hover)

Text:
  --text-primary:   #EDEDEF     (bright white, not pure #FFF)
  --text-secondary: #8A8F98     (muted gray)
  --text-muted:     #4A4F5A     (very muted, labels)

Agent Node Colors (vivid, glowing — these are the STARS of the UI):
  --node-collector:  #06B6D4    (cyan — scanning, data)
  --node-analyzer:   #6366F1    (indigo — deep analysis)
  --node-strategy:   #F59E0B    (amber — golden strategy)
  --node-risk:       #EF4444    (red — danger, validation)
  --node-nash:       #8B5CF6    (violet — AI decision, purple brain)

Each node color has a glow variant at 20-30% opacity for halos:
  --glow-collector:  rgba(6, 182, 212, 0.25)
  --glow-analyzer:   rgba(99, 102, 241, 0.25)
  --glow-strategy:   rgba(245, 158, 11, 0.25)
  --glow-risk:       rgba(239, 68, 68, 0.25)
  --glow-nash:       rgba(139, 92, 246, 0.30)

Borders:
  --border:          rgba(255, 255, 255, 0.06)   (hairline borders)
  --border-hover:    rgba(255, 255, 255, 0.12)   (hover borders)

Accent:
  --accent:          #8B5CF6    (violet — primary CTA, links)
  --accent-glow:     rgba(139, 92, 246, 0.2)
```

### 1.3 Typography
```
Font:       Inter (400, 500, 600, 700)
Mono:       JetBrains Mono (400, 500)

CSS Import:
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

Scale:
  Hero title:     clamp(3rem, 6vw, 5rem) / 700 / -0.03em tracking
  Page title:     2rem / 700 / -0.02em tracking
  Section title:  1.25rem / 600
  Body:           1rem (16px) / 400 / 1.6 line-height
  Small:          0.875rem / 400
  Label:          0.75rem / 500 / uppercase / +0.08em tracking
  Data value:     JetBrains Mono / 1rem / 500 / tabular-nums
  Big number:     JetBrains Mono / 2rem / 700
```

### 1.4 Card Style (Frosted Glass)
```
Background:     var(--bg-glass)             rgba(255,255,255,0.03)
Backdrop:       backdrop-blur-xl            (blur behind card)
Border:         1px solid var(--border)     rgba(255,255,255,0.06)
Border-radius:  16px                        (rounded-2xl)
Inner highlight: box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)  (top edge catch-light)
Outer shadow:   0 4px 24px rgba(0,0,0,0.4)

Hover state:
  Border:       var(--border-hover)         rgba(255,255,255,0.12)
  Background:   var(--bg-glass-hover)       rgba(255,255,255,0.06)
  Transform:    translateY(-1px)
  Transition:   all 300ms cubic-bezier(0.16, 1, 0.3, 1)
```

### 1.5 Animation System
```
Easing:
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1)     (Expo.out — smooth deceleration)
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  (slight overshoot for playful elements)

Durations:
  Micro (hover, press):     150-200ms
  Standard (card enter):    300ms
  Complex (page transition): 500ms
  Ambient (blob drift):     20-30s infinite

Framer Motion Spring Configs:
  Snappy:   { type: "spring", stiffness: 300, damping: 30 }
  Gentle:   { type: "spring", stiffness: 100, damping: 20 }
  Bouncy:   { type: "spring", stiffness: 200, damping: 15 }

Rules:
  - Enter: fade + translateY(12px) → translateY(0)
  - Exit: faster than enter (70% of enter duration)
  - Stagger: 50-80ms between siblings
  - Active states: scale(1.02) max — never more
  - Respect prefers-reduced-motion
```

---

## 2. LANDING PAGE

### 2.1 Layout
```
Full viewport height, centered content.
NavBar (glass, fixed top) → Hero → Wallet Input → Feature Cards → Footer hint
```

### 2.2 Hero Section (center of page)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [Subtle grid background]               │
│                                                     │
│         ●────●────●────●────●                       │
│        (miniature neural network animation           │
│         5 small dots connected by lines,             │
│         colors = agent colors,                       │
│         dots pulse softly, lines shimmer)            │
│                                                     │
│           AUTONOMOUS DEFI                           │
│        (Inter 700, 5rem, white,                     │
│         letter-spacing: -0.03em)                    │
│                                                     │
│     AI agents that think, debate, and execute       │
│        (Inter 400, 1.125rem, #8A8F98)              │
│                                                     │
│     ┌─────────────────────────────────┐             │
│     │  0x...  [→]                     │             │
│     └─────────────────────────────────┘             │
│     (glass input bar, violet accent button,         │
│      subtle glow ring on focus)                     │
│                                                     │
│     "Try Demo Wallet" link below                    │
│                                                     │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│     │ 5 Agents│  │On-Chain │  │  Risk   │         │
│     │   ◉     │  │   ⚡    │  │   🛡   │         │
│     │ analyze │  │ execute │  │validate │         │
│     └─────────┘  └─────────┘  └─────────┘         │
│     (3 glass cards, icons are Lucide SVGs,          │
│      subtle hover: border brightens)                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.3 Mini Neural Network Animation (above title)
- 5 small circles (12px each) in agent colors, arranged in a gentle arc
- Connected by thin lines (1px, rgba(255,255,255,0.1))
- Each dot has a soft glow halo in its color (blur 8px, 20% opacity)
- Animation: Dots pulse in sequence left-to-right (1→2→3→4→5) every 3 seconds
- When a dot pulses: it scales to 1.3x, glow brightens to 40%, then returns
- The connecting line between pulsing dots briefly brightens (like data traveling)
- This is a PREVIEW of what the full agent pipeline looks like

### 2.4 Wallet Input
- Glass card background: rgba(255,255,255,0.03) backdrop-blur
- Input: transparent bg, white text, placeholder #4A4F5A
- Submit button: bg-[#8B5CF6] (violet), rounded-xl, subtle glow shadow
- On focus: ring-2 ring-violet-500/30 on the entire input bar
- "Try Demo Wallet" — text-[#8A8F98] hover:text-white, small link below

### 2.5 Entrance Animations
```
1. Grid fades in (0-500ms, opacity 0 → 0.02)
2. Mini neural network dots appear one by one (200-600ms, staggered 80ms)
3. Title fades up (400-700ms)
4. Subtitle fades up (500-800ms)
5. Input bar fades up (600-900ms)
6. Feature cards stagger in (800-1200ms, 80ms apart)
```

---

## 3. NAVBAR

```
Position:     fixed top, full width, z-50
Background:   rgba(5, 5, 5, 0.8) + backdrop-blur-xl
Border:       bottom 1px solid rgba(255,255,255,0.06)
Height:       56px (h-14)
Padding:      0 24px (px-6)
Max-width:    1280px centered

Left:         "Autonomous DeFi" — Inter 600, text-sm, #EDEDEF
              Small violet dot (w-1.5 h-1.5 rounded-full bg-violet-500) as separator
              "Neural Agents" — Inter 400, text-xs, #4A4F5A

Right:        Wallet address pill: bg-glass, border, font-mono text-xs, #8A8F98
              Green health dot (w-2 h-2, bg-emerald-400 with ping animation)
```

---

## 4. AGENT PIPELINE — THE NEURAL NETWORK (★ Hero feature of the entire app)

This is the centerpiece. This is what makes professors say "holy shit."

### 4.1 Layout: Neural Network Graph
```
NOT a horizontal card row. It's a NETWORK DIAGRAM.

Desktop layout (SVG-based or absolute positioned):

                    ●  Market Analyzer
                   / \
  Data Collector ●    ● Strategy Proposer
                   \ /          |
                    ●  Risk Validator
                    |
                    ●  Nash Negotiator

Each ● is a Neural Node (see 4.2).
Lines are Synapse Connections (see 4.3).
The entire thing is ~500px tall, centered, responsive.

Mobile: Falls back to vertical list with connecting lines.
```

### 4.2 Neural Node (Each Agent)
```
Structure:
  ┌──────────────────────────────┐
  │                              │
  │        ◉  (Glow Orb)        │  ← 48px glowing circle
  │                              │
  │     Agent Name               │  ← Inter 500, 14px, white
  │     Status text              │  ← Inter 400, 12px, #8A8F98
  │                              │
  └──────────────────────────────┘
  Card: 140x160px, glass bg, rounded-2xl

The Glow Orb:
  - 48px circle
  - Gradient fill: radial-gradient from agent color (center) to transparent (edge)
  - Surrounded by a glow halo: box-shadow 0 0 20px agent-glow-color
  - Contains agent icon (Lucide SVG, 20px, white) in the center

States:

  IDLE:
    - Orb: dim (30% opacity), no glow halo
    - Icon: #4A4F5A (muted)
    - Card: default glass bg
    - Status: "Standby" in #4A4F5A

  ACTIVE:
    - Orb: full brightness (100% opacity), glow halo pulses (2s cycle)
    - Icon: white, slight scale bounce on activation (spring: stiffness 200, damping 15)
    - Card: border brightens to agent-color at 20% opacity
    - Glow halo: box-shadow 0 0 30px 10px agent-glow-color (spreads outward)
    - Status: shows live progress text, typing animation
      e.g. "Scanning 25 tokens..." typed out character by character
    - PARTICLE EFFECT: 4-6 tiny dots (2px) in agent color orbit slowly around the orb
      (CSS animation, 4s rotation, different radii for each particle)

  COMPLETE:
    - Orb: full brightness, glow steady (no pulse)
    - Icon: transitions to CheckCircle (green #22C55E) with spring animation
    - Card: subtle green tint on border
    - Status: "Complete" in #22C55E
    - Particles: slow to a stop and fade out

  ERROR:
    - Orb: red glow, flickering (fast pulse)
    - Icon: AlertCircle in red
    - Status: error message in #EF4444
```

### 4.3 Synapse Connections (Lines Between Nodes)
```
Implementation: SVG <line> or <path> elements overlaid on the network

IDLE state:
  - 1px line, rgba(255,255,255,0.06) — barely visible
  - Dashed: stroke-dasharray="4 4"

DATA FLOWING state (when source agent completes):
  - Line brightens to source agent's color at 30% opacity
  - A LIGHT PARTICLE (4px circle, agent color, full brightness) travels
    along the line from source to destination over 800ms
  - Line has a brief "wake" glow behind the particle (like a comet tail)
  - Easing: cubic-bezier(0.16, 1, 0.3, 1)

COMPLETE state:
  - Line stays at 15% opacity in agent color (shows the path data took)
  - No more animation

Implementation detail:
  Use SVG <circle> with animateMotion along a <path> for the traveling particle.
  Or: use Framer Motion to animate a dot's position along calculated coordinates.
```

### 4.4 Progress Indicator
```
Below the neural network:
- Thin line (2px) spanning full width
- Background: rgba(255,255,255,0.06)
- Fill: gradient from first agent color to current agent color
- Smooth width transition (700ms ease-out)
- Percentage text on the right: JetBrains Mono, 12px, #8A8F98
```

### 4.5 Live Progress Message
```
Below progress bar:
- Single line of text showing latest agent message
- Format: "[Agent Name] message..." 
- Agent name in agent's color, message in #8A8F98
- TYPING ANIMATION: characters appear one by one (30ms per char)
- When new message arrives: old text fades out (150ms), new text types in
```

---

## 5. NEGOTIATION SECTION

### 5.1 Container
```
Glass card, full width (max-w-4xl), rounded-2xl
Header:
  Left:  "Agent Negotiation" — Inter 600, 14px, white
  Right: Live indicator — pulsing green dot + "Live" text when active

Border: 1px solid rgba(255,255,255,0.06)
```

### 5.2 Message Design
```
┌─────────────────────────────────────────────────────┐
│ ◉ Strategy Proposer                    Round 1      │
│                                                     │
│ Recommending aggressive liquidity provision:        │
│ ETH-USDC pool, wide range [1800-3200],             │
│ projected 15.2% APY...                              │
│                                                     │
│ ┌──────────┐ ┌───────────┐ ┌───────────────┐      │
│ │ APY: 15% │ │ Wide Range│ │ High Confidence│      │
│ └──────────┘ └───────────┘ └───────────────┘      │
└─────────────────────────────────────────────────────┘

- Avatar: 32px glow orb (same as neural node but smaller)
- Agent name: agent's color, Inter 500
- Round badge: bg-glass, text-[#4A4F5A], rounded-full, text-xs
- Message body: #8A8F98, Inter 400, 14px
- Key point pills: bg-[rgba(255,255,255,0.04)], border rgba(255,255,255,0.06), rounded-lg
- Messages appear with typing animation (text reveals character by character)

Nash Negotiator messages:
  - SPECIAL TREATMENT: Full-width, bg-violet-500/5, border border-violet-500/15
  - Orb glows brighter, centered layout
  - "FINAL DECISION" label above message in violet, uppercase, tracking-wider
```

### 5.3 Ping-Pong Effect During Negotiation
```
Between Strategy Proposer and Risk Validator nodes in the neural network above:
- When Strategy proposes: a light dot (amber) shoots from Strategy → Risk node
- When Risk critiques: a light dot (red) shoots back from Risk → Strategy node
- Each round, the dots move FASTER (round 1: 1000ms, round 5: 400ms)
- When Nash decides: both dots merge and fly to Nash node
This happens in the neural network visualization, synced with chat messages.
```

---

## 6. RESULTS SECTION

### 6.1 Entrance
```
When analysis completes:
- Neural network nodes all glow bright simultaneously for 500ms (celebration flash)
- Then dim to complete state
- Divider line draws from center outward (300ms)
- "Strategic Output" label fades in at center of divider
- Result cards stagger in below (80ms between each, fade + translateY)
```

### 6.2 Final Recommendation Card (Hero Card)
```
Larger glass card with a colored accent:
- Left border: 3px solid in action color (amber for add_liquidity, blue for swap, violet for hold)
- Background: rgba(255,255,255,0.03) with subtle backdrop-blur
- Action title: Inter 700, 1.5rem, white
- Stats row: APY / Risk / Confidence — each in a mini glass pill
  - APY value: emerald color
  - Risk value: red color  
  - Confidence value: violet color
- Execute button: bg-[#8B5CF6] text-white, rounded-xl, violet glow shadow
  hover: brighter, scale(1.02)
- Explanation: #8A8F98, bordered-left with #1A1A24
```

### 6.3 Charts (4-grid)
```
All charts in glass cards. Dark transparent backgrounds let the ambient blobs show through slightly.

1. Portfolio Donut: 
   - Segment colors match agent palette (amber, blue, violet, cyan, emerald)
   - Center: total value in JetBrains Mono, large, white
   
2. Risk Gauge:
   - SVG semicircle, gradient green → amber → red
   - Needle/indicator dot in white
   - Center value: JetBrains Mono, large
   
3. Nash Bargaining:
   - Scatter on dark bg, grid lines at rgba(255,255,255,0.04)
   - Nash point: violet glow dot, pulsing
   - Axes labeled clearly: "Safety" / "Return"
   
4. Confidence Meter:
   - Vertical bar, gradient violet → indigo
   - Percentage value large above
```

### 6.4 Backtest Panel
```
Glass card with line chart:
- AI Strategy line: violet (#8B5CF6), solid, 2px
- ETH Hold line: #4A4F5A, dashed, 1.5px
- Stats: AI return (emerald), Hold return (muted), Alpha (amber/gold)
- Grid: rgba(255,255,255,0.03)
```

### 6.5 Transaction Status (after Execute click)
```
States appear inline below the Recommendation card:

AWAITING:   Glass card, amber border glow, wallet icon pulsing, "Confirm in MetaMask..."
SUBMITTED:  Glass card, violet border, spinning loader, tx hash link to Etherscan
CONFIRMING: Glass card, animated progress bar filling
SUCCESS:    Glass card, emerald border glow, large checkmark with spring animation,
            "Strategy Logged On-Chain" + Etherscan link button
```

---

## 7. DASHBOARD PAGE

### 7.1 Layout
```
NavBar → Header → Market Stats Row → Portfolio Card → Holdings → Risk Prefs → CTA
```

### 7.2 Market Stats Row (3 glass cards)
```
Each card: glass bg, 1px border, rounded-2xl, p-5
- Label: uppercase, tracking-wider, 11px, #4A4F5A
- Value: JetBrains Mono, 20px, white
- Fear & Greed: colored badge (red/amber/green based on value)
- ETH Price: white mono number + small change badge
- Uniswap TVL: white mono number
```

### 7.3 Portfolio Card
```
Large glass card:
- Total value: JetBrains Mono, 2.5rem, 700, white
- "Total Portfolio Value" label above in #4A4F5A
- 24h change badge: emerald (positive) or red (negative)
```

### 7.4 Holdings Table
```
Glass card:
- Header row: #4A4F5A, uppercase, tracking-wider, 11px
- Data rows: alternating bg transparent / rgba(255,255,255,0.02)
- Token icon: colored dot (not actual icon) + symbol in white
- Balance: JetBrains Mono, white
- Value: JetBrains Mono, white
- Allocation: progress bar + percentage, bar color matches token
```

### 7.5 Risk Preferences
```
Glass card:
- Segmented control: 3 buttons (Conservative / Moderate / Aggressive)
  - Selected: bg-[#8B5CF6] text-white (violet, not amber — violet is our primary CTA color)
  - Others: bg-transparent text-[#8A8F98] border border-rgba(255,255,255,0.06)
- Sliders: track is rgba(255,255,255,0.06), fill is violet, thumb is white circle
```

### 7.6 Start Analysis CTA
```
Full-width button at bottom:
- bg-[#8B5CF6] text-white font-semibold rounded-xl py-4
- Glow: box-shadow 0 0 30px rgba(139,92,246,0.3)
- Hover: brighter violet, scale(1.01), glow intensifies
- Text: "Start AI Analysis" + small ArrowRight icon
```

---

## 8. MICRO-INTERACTIONS & POLISH

### 8.1 Cursor
- All clickable elements: cursor-pointer
- Buttons on hover: subtle brightness increase + shadow grow

### 8.2 Focus States
- All focusable elements: ring-2 ring-violet-500/30 ring-offset-2 ring-offset-[#050505]
- Visible, accessible, matches the violet theme

### 8.3 Selection
- selection:bg-violet-500/30 selection:text-violet-200

### 8.4 Scrollbar (custom)
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
```

### 8.5 Toast Notifications
- Background: #0A0A0F
- Border: rgba(255,255,255,0.06)
- Success: emerald left border
- Error: red left border

### 8.6 Button Hover States
```
Primary (violet):
  hover: brightness-110, shadow grows
  active: scale(0.98), 100ms

Secondary (glass):
  hover: bg-glass-hover, border-hover
  active: scale(0.98)
```

---

## 9. RESPONSIVE BEHAVIOR

```
Mobile (< 768px):
  - Neural network → vertical node list with connecting lines
  - Charts grid: 1 column
  - Feature cards: 1 column stack
  - NavBar: logo only, wallet in dropdown
  
Tablet (768-1024px):
  - Neural network: simplified layout (2 rows)
  - Charts grid: 2x2
  - Feature cards: 3 columns (narrower)

Desktop (> 1024px):
  - Full neural network layout
  - Charts: 4 columns
  - Max content width: 1280px
```

---

## 10. FILES TO CREATE/MODIFY

```
NEW:
  components/neural/NeuralNetwork.tsx      ← The SVG neural network visualization
  components/neural/NeuralNode.tsx         ← Single node with glow orb + particles
  components/neural/SynapseConnection.tsx  ← Animated line + traveling particle
  components/neural/MiniNetwork.tsx        ← Small version for landing page hero
  components/layout/AmbientBackground.tsx  ← Gradient blobs + grid

MODIFY:
  app/globals.css                          ← New color system + animations
  app/layout.tsx                           ← New fonts + ambient bg
  app/page.tsx                             ← Landing with mini network + glass input
  app/dashboard/page.tsx                   ← Glass cards + violet accent
  app/analyze/page.tsx                     ← Neural network + results
  components/layout/NavBar.tsx             ← Glass nav
  components/agents/NegotiationChat.tsx    ← Glow orb avatars + typing
  components/results/*.tsx                 ← Glass card style
  components/charts/*.tsx                  ← Dark transparent chart bg

KEEP AS-IS:
  All backend files (already done in Phase 1-3)
  hooks/useAnalysis.ts (already updated)
  lib/abi.ts (already updated)
```

---

## 11. COLOR SUMMARY (Quick Reference)

| Element | Color | Hex |
|---------|-------|-----|
| Background | Near-black | #050505 |
| Card surface | Very dark | #0A0A0F |
| Card hover | Slightly lighter | #111118 |
| Glass | White 3% | rgba(255,255,255,0.03) |
| Border | White 6% | rgba(255,255,255,0.06) |
| Text primary | Soft white | #EDEDEF |
| Text secondary | Muted gray | #8A8F98 |
| Text muted | Very muted | #4A4F5A |
| Primary CTA | Violet | #8B5CF6 |
| Data Collector | Cyan | #06B6D4 |
| Market Analyzer | Indigo | #6366F1 |
| Strategy Proposer | Amber | #F59E0B |
| Risk Validator | Red | #EF4444 |
| Nash Negotiator | Violet | #8B5CF6 |
| Success | Emerald | #22C55E |
| Warning | Amber | #F59E0B |
| Error | Red | #EF4444 |
