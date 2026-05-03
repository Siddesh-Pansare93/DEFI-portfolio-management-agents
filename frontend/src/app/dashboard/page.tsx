"use client";

import { useEffect, useState, Suspense } from "react";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import { getMarketOverview, getPortfolio, startAnalysisWithPreferences } from "@/lib/api";
import { MarketOverviewResponse, UserPreferences } from "@/lib/types";
import { usePreferences } from "@/hooks/usePreferences";
import { NavBar } from "@/components/layout/NavBar";
import {
  Wallet, Loader2, TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight,
  Activity, Brain, Shield, Zap, Eye, Clock, AlertTriangle, CheckCircle2,
  BarChart3, Cpu, Globe, Radio, Flame, Target
} from "lucide-react";
import { motion } from "framer-motion";
import { JarvisButton } from "@/components/ui/jarvis-button";

// ─── Simulated Data ──────────────────────────────────────────────────────────

const SIMULATED_TOKENS = [
  { symbol: "ETH", name: "Ethereum", balance: 15.2, price: 2220, change24h: 4.86, color: "#627EEA" },
  { symbol: "USDC", name: "USD Coin", balance: 4200, price: 1.0, change24h: 0.01, color: "#2775CA" },
  { symbol: "LINK", name: "Chainlink", balance: 500, price: 15.20, change24h: -2.1, color: "#2A5ADA" },
  { symbol: "UNI", name: "Uniswap", balance: 120, price: 9.45, change24h: 1.8, color: "#FF007A" },
  { symbol: "AAVE", name: "Aave", balance: 2.5, price: 255, change24h: 3.2, color: "#B6509E" },
  { symbol: "WBTC", name: "Wrapped BTC", balance: 0.015, price: 66200, change24h: 1.1, color: "#F7931A" },
  { symbol: "MKR", name: "Maker", balance: 0.8, price: 1850, change24h: -0.9, color: "#1AAB9B" },
  { symbol: "CRV", name: "Curve", balance: 2500, price: 0.55, change24h: -3.4, color: "#FF6B6B" },
];

const LIVE_FEED = [
  { time: "2m ago", event: "ETH price crossed $2,200 resistance", type: "signal", severity: "high" },
  { time: "8m ago", event: "Uniswap V3 ETH-USDC pool: $2.4M volume spike", type: "pool", severity: "medium" },
  { time: "15m ago", event: "Fear & Greed index shifted from 45 to 52", type: "sentiment", severity: "low" },
  { time: "23m ago", event: "LINK whale moved 50,000 tokens to DeFi protocol", type: "whale", severity: "high" },
  { time: "31m ago", event: "Gas prices dropped to 12 gwei — optimal for execution", type: "gas", severity: "low" },
  { time: "45m ago", event: "Aave lending rate increased to 4.2% APY", type: "yield", severity: "medium" },
  { time: "1h ago", event: "New governance proposal on Uniswap — fee tier changes", type: "governance", severity: "medium" },
  { time: "2h ago", event: "BTC dominance decreased to 54.2% — altcoin rotation signal", type: "signal", severity: "high" },
];

const AGENT_STATUS = [
  { name: "Data Collector", status: "ready", lastRun: "3m ago", icon: Cpu, color: "#06B6D4" },
  { name: "Market Analyzer", status: "ready", lastRun: "3m ago", icon: BarChart3, color: "#6366F1" },
  { name: "Strategy Proposer", status: "ready", lastRun: "3m ago", icon: Target, color: "#F59E0B" },
  { name: "Risk Validator", status: "ready", lastRun: "3m ago", icon: Shield, color: "#EF4444" },
  { name: "Nash Negotiator", status: "ready", lastRun: "3m ago", icon: Brain, color: "#8B5CF6" },
];

const RECENT_ANALYSES = [
  { action: "ADD LIQUIDITY", apy: "8.5%", confidence: "78%", time: "Today, 1:42 AM", status: "executed" },
  { action: "HOLD POSITION", apy: "0%", confidence: "65%", time: "Yesterday, 11:20 PM", status: "completed" },
  { action: "ADD LIQUIDITY", apy: "12.1%", confidence: "82%", time: "Apr 8, 3:15 PM", status: "executed" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUSD(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(2)}`;
}

function fgColor(i: number) {
  if (i < 25) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (i < 45) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (i < 55) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (i < 75) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
}

function severityColor(s: string) {
  if (s === "high") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (s === "medium") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}

function severityIcon(s: string) {
  if (s === "high") return <AlertTriangle className="w-3 h-3" />;
  if (s === "medium") return <Radio className="w-3 h-3" />;
  return <CheckCircle2 className="w-3 h-3" />;
}

// ─── Main Content ────────────────────────────────────────────────────────────

function DashboardContent() {
  const { address: wagmiAddr, isConnected: wagmiConn } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlWallet = searchParams.get("wallet");
  const address = wagmiAddr || (urlWallet as `0x${string}` | undefined);
  const isConnected = wagmiConn || !!urlWallet;

  const [marketData, setMarketData] = useState<MarketOverviewResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const { preferences, setPreferences, applyPreset } = usePreferences();

  const totalValue = SIMULATED_TOKENS.reduce((s, t) => s + t.balance * t.price, 0);
  const totalChange = 4.86; // Simulated 24h change

  useEffect(() => {
    getMarketOverview().then(setMarketData).catch(() => {});
  }, []);

  const handleStartAnalysis = async () => {
    if (!address) return;
    setIsStarting(true);
    try {
      const data = await startAnalysisWithPreferences(address, preferences);
      router.push(`/analyze?wallet=${address}&job=${data.jobId}`);
    } catch {
      setIsStarting(false);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col bg-transparent">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="font-bold text-2xl text-white">Connect Your Wallet</h2>
            <p className="text-white/40 text-sm">Connect via MetaMask or enter a wallet address on the landing page.</p>
          </div>
        </div>
      </main>
    );
  }

  const presets = [
    { key: "conservative", label: "Conservative" },
    { key: "moderate", label: "Moderate" },
    { key: "aggressive", label: "Aggressive" },
  ];

  return (
    <main className="min-h-screen bg-transparent">
      <NavBar />

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 pt-20 pb-12">

        {/* ── Top Bar: Title + Alert ── */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-violet-400 font-medium">Live Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Command Center</h1>
            <p className="font-mono text-xs text-white/30 mt-0.5">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </div>
            <div className="font-mono text-xs text-white/30">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* ── Row 1: Stat Cards (5 cards) ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {/* Portfolio Value */}
          <div className="glass-card p-4 col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">Portfolio</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">{formatUSD(totalValue)}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-mono">+{totalChange}%</span>
              <span className="text-[10px] text-white/20 ml-1">24h</span>
            </div>
          </div>

          {/* ETH Price */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">ETH Price</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">
              {marketData?.ethPrice ? formatUSD(marketData.ethPrice) : "$2,220"}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-mono">+4.86%</span>
            </div>
          </div>

          {/* Fear & Greed */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">Fear & Greed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-2xl font-bold px-2 py-0.5 rounded border ${fgColor(marketData?.fearGreedIndex ?? 50)}`}>
                {marketData?.fearGreedIndex ?? 50}
              </span>
            </div>
            <div className="text-[10px] text-white/30 mt-1">{marketData?.fearGreedLabel ?? "Neutral"}</div>
          </div>

          {/* Active Tokens */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">Tokens Tracked</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">{SIMULATED_TOKENS.length}</div>
            <div className="text-[10px] text-white/30 mt-1">{SIMULATED_TOKENS.filter(t => t.balance * t.price > 100).length} with holdings</div>
          </div>

          {/* Uniswap TVL */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">Uniswap TVL</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">
              {marketData?.uniswapTVL ? formatUSD(marketData.uniswapTVL) : "$4.2B"}
            </div>
            <div className="text-[10px] text-white/30 mt-1">Global liquidity</div>
          </div>
        </div>

        {/* ── Row 2: Main 3-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── LEFT: Token Holdings (4 cols) ── */}
          <div className="lg:col-span-4 space-y-4">
            {/* Holdings Table */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Portfolio Holdings</span>
                <span className="text-[10px] text-white/20">{SIMULATED_TOKENS.length} tokens</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {SIMULATED_TOKENS.map((token) => {
                  const value = token.balance * token.price;
                  const alloc = (value / totalValue) * 100;
                  return (
                    <div key={token.symbol} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                      {/* Token dot */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${token.color}20`, color: token.color }}>
                        {token.symbol.slice(0, 2)}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{token.symbol}</span>
                          <span className="font-mono text-sm text-white">{formatUSD(value)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-white/30">{token.balance.toLocaleString()} @ {formatUSD(token.price)}</span>
                          <div className="flex items-center gap-1">
                            {token.change24h >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-400" />
                            )}
                            <span className={`text-[10px] font-mono ${token.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {token.change24h >= 0 ? "+" : ""}{token.change24h}%
                            </span>
                          </div>
                        </div>
                        {/* Allocation bar */}
                        <div className="mt-1.5 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(alloc, 100)}%`, backgroundColor: token.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── CENTER: Live Feed (5 cols) ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Feed */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-medium">Live Feed</span>
                </div>
                <span className="text-[10px] text-white/20">{LIVE_FEED.length} events</span>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
                {LIVE_FEED.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border font-medium shrink-0 ${severityColor(item.severity)}`}>
                        {severityIcon(item.severity)}
                        {item.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 leading-snug">{item.event}</p>
                      </div>
                      <span className="text-[10px] text-white/20 shrink-0 font-mono">{item.time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Recent Analyses</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {RECENT_ANALYSES.map((a, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${a.status === "executed" ? "bg-emerald-400" : "bg-violet-400"}`} />
                      <div>
                        <span className="text-sm font-medium text-white">{a.action}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-emerald-400 font-mono">APY {a.apy}</span>
                          <span className="text-[10px] text-violet-400 font-mono">{a.confidence} conf</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] uppercase tracking-wider ${a.status === "executed" ? "text-emerald-400" : "text-white/30"}`}>{a.status}</span>
                      <div className="text-[10px] text-white/20 mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Agent Network + Controls (3 cols) ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Agent Network Status */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-violet-400 font-medium">Agent Network</span>
                <span className="text-[10px] text-white/20">5 agents</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {AGENT_STATUS.map((agent) => (
                  <div key={agent.name} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}15` }}>
                      <agent.icon className="w-4 h-4" style={{ color: agent.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white">{agent.name}</div>
                      <div className="text-[10px] text-white/30">{agent.lastRun}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400 uppercase">{agent.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Preferences */}
            <div className="glass-card p-4">
              <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium block mb-3">Risk Profile</span>
              <div className="flex gap-1.5 mb-4">
                {presets.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      preferences.riskAppetite === p.key
                        ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                        : "bg-white/[0.03] text-white/40 hover:bg-white/[0.06] border border-white/[0.06]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Max IL */}
              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-white/30">Max Impermanent Loss</span>
                  <span className="text-[10px] text-white/60 font-mono">{(preferences.maxImpermanentLoss * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={1} max={20} step={1}
                  value={preferences.maxImpermanentLoss * 100}
                  onChange={(e) => setPreferences({ ...preferences, maxImpermanentLoss: parseInt(e.target.value) / 100 })}
                  className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              {/* Max Position */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-white/30">Max Position Size</span>
                  <span className="text-[10px] text-white/60 font-mono">{(preferences.maxPositionSize * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={10} max={100} step={5}
                  value={preferences.maxPositionSize * 100}
                  onChange={(e) => setPreferences({ ...preferences, maxPositionSize: parseInt(e.target.value) / 100 })}
                  className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>

            {/* START ANALYSIS — Jarvis Brain Assembly Button */}
            <JarvisButton
              onClick={handleStartAnalysis}
              isLoading={isStarting}
              disabled={!address}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Export with Suspense ─────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
