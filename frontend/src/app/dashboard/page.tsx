"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import {
  getMarketOverview,
  getPortfolio,
  startAnalysisWithPreferences,
} from "@/lib/api";
import { MarketOverviewResponse, PortfolioResponse, UserPreferences } from "@/lib/types";
import { usePreferences } from "@/hooks/usePreferences";
import { NavBar } from "@/components/layout/NavBar";
import { Wallet, AlertCircle, Loader2, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(2)}`;
}

function fearGreedColor(index: number): string {
  if (index < 25) return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (index < 45) return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  if (index < 55) return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  if (index < 75) return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/30";
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Data state
  const [marketData, setMarketData] = useState<MarketOverviewResponse | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioResponse | null>(null);

  // Loading states
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);

  // Error states
  const [marketError, setMarketError] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Analysis launch
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Preferences
  const { preferences, setPreferences, applyPreset } = usePreferences();

  // ---------- Data fetching ----------

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        setIsMarketLoading(true);
        const data = await getMarketOverview();
        setMarketData(data);
      } catch (err) {
        console.error("Failed to fetch market data:", err);
        setMarketError("Could not load market overview.");
      } finally {
        setIsMarketLoading(false);
      }
    };
    fetchMarket();
  }, []);

  useEffect(() => {
    if (!address) return;
    const fetchPortfolio = async () => {
      try {
        setIsPortfolioLoading(true);
        setPortfolioData(null);
        const data = await getPortfolio(address);
        setPortfolioData(data);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
        setPortfolioError("Could not load portfolio data.");
      } finally {
        setIsPortfolioLoading(false);
      }
    };
    fetchPortfolio();
  }, [address]);

  // ---------- Start analysis ----------

  const handleStartAnalysis = async () => {
    if (!address) return;
    setIsStarting(true);
    setStartError(null);
    try {
      const data = await startAnalysisWithPreferences(address, preferences);
      router.push(`/analyze?wallet=${address}&job=${data.jobId}`);
    } catch (err) {
      console.error("Analysis start failed:", err);
      setStartError("Failed to start analysis. Is the backend running?");
      setIsStarting(false);
    }
  };

  // ---------- Not connected state ----------

  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col bg-transparent">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full glass-card p-8 text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <Wallet className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="font-sans font-bold text-2xl text-white">
              Connect Your Wallet
            </h2>
            <p className="text-[#8A8F98] text-sm leading-relaxed">
              Please connect your wallet to access the Autonomous DeFi Command Center.
            </p>
            <p className="text-violet-400 text-sm animate-pulse font-medium">
              Use the Connect button in the top right
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  // ---------- Token rows from portfolio ----------

  const tokenEntries = portfolioData?.holdings
    ? Object.entries(portfolioData.holdings)
    : [];

  // ---------- Preset buttons ----------

  const presets: { key: UserPreferences["riskAppetite"]; label: string }[] = [
    { key: "conservative", label: "Conservative" },
    { key: "moderate", label: "Moderate" },
    { key: "aggressive", label: "Aggressive" },
  ];

  // =======================================================================
  // Render
  // =======================================================================

  return (
    <main className="min-h-screen flex flex-col bg-transparent">
      <NavBar />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-12 space-y-8">
        {/* ----------------------------------------------------------------
            HEADER
        ----------------------------------------------------------------- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <h1 className="font-sans font-bold text-3xl text-white tracking-tight">
            Command Center
          </h1>
          <p className="font-mono text-sm text-[#8A8F98] mt-1">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </motion.div>

        {/* ----------------------------------------------------------------
            MARKET STATS ROW
        ----------------------------------------------------------------- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {/* Fear & Greed */}
          <div className="glass-card p-5 flex flex-col gap-2">
            <span className="text-[#4A4F5A] text-[11px] uppercase tracking-wider font-semibold">
              Fear &amp; Greed
            </span>
            {isMarketLoading ? (
              <div className="h-8 w-24 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
            ) : marketError ? (
              <span className="text-red-400 text-sm">{marketError}</span>
            ) : (
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold font-mono ${fearGreedColor(
                    marketData?.fearGreedIndex ?? 50
                  )}`}
                >
                  {marketData?.fearGreedIndex ?? "--"}
                </span>
                <span className="text-[#8A8F98] text-sm">
                  {marketData?.fearGreedLabel ?? ""}
                </span>
              </div>
            )}
          </div>

          {/* ETH Price */}
          <div className="glass-card p-5 flex flex-col gap-2">
            <span className="text-[#4A4F5A] text-[11px] uppercase tracking-wider font-semibold">
              ETH Price
            </span>
            {isMarketLoading ? (
              <div className="h-8 w-32 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[20px] text-white font-medium">
                  {marketData?.ethPrice
                    ? `$${marketData.ethPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "--"}
                </span>
              </div>
            )}
          </div>

          {/* Uniswap TVL */}
          <div className="glass-card p-5 flex flex-col gap-2">
            <span className="text-[#4A4F5A] text-[11px] uppercase tracking-wider font-semibold">
              Uniswap TVL
            </span>
            {isMarketLoading ? (
              <div className="h-8 w-28 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
            ) : (
              <span className="font-mono text-[20px] text-white font-medium mt-1">
                {marketData?.uniswapTVL
                  ? formatUSD(marketData.uniswapTVL)
                  : "--"}
              </span>
            )}
          </div>
        </motion.div>

        {/* ----------------------------------------------------------------
            PORTFOLIO CARD
        ----------------------------------------------------------------- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="glass-card p-6 md:p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#8A8F98]" />
            <span className="text-[#4A4F5A] text-sm font-medium">
              Total Portfolio Value
            </span>
          </div>

          {isPortfolioLoading ? (
            <div className="h-12 w-48 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
          ) : portfolioError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {portfolioError}
            </div>
          ) : (
            <span className="text-white font-mono text-[2.5rem] font-bold tracking-tight">
              {formatUSD(portfolioData?.totalValueUSD ?? 0)}
            </span>
          )}
        </motion.div>

        {/* ----------------------------------------------------------------
            HOLDINGS TABLE
        ----------------------------------------------------------------- */}
        {tokenEntries.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="glass-card overflow-hidden"
          >
            {/* Table header */}
            <div className="grid grid-cols-4 px-6 py-4 text-[#4A4F5A] text-[11px] uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)]">
              <span>Token</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Price</span>
              <span className="text-right">Value</span>
            </div>

            {/* Table rows */}
            <div className="flex flex-col">
              {tokenEntries.map(([symbol, holding], idx) => (
                <div
                  key={symbol}
                  className={`grid grid-cols-4 px-6 py-4 items-center ${
                    idx % 2 === 0 ? "bg-transparent" : "bg-[rgba(255,255,255,0.02)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-white font-medium text-sm">{symbol}</span>
                  </div>
                  <span className="text-right font-mono text-white text-sm">
                    {holding.balance < 0.0001
                      ? holding.balance.toExponential(2)
                      : holding.balance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                  </span>
                  <span className="text-right font-mono text-[#8A8F98] text-sm">
                    {formatUSD(holding.priceUSD)}
                  </span>
                  <span className="text-right font-mono text-white text-sm">
                    {formatUSD(holding.valueUSD)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------------------
            RISK PREFERENCES
        ----------------------------------------------------------------- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="glass-card p-6 md:p-8 space-y-6"
        >
          <h2 className="font-sans font-semibold text-lg text-white">
            Risk Preferences
          </h2>

          {/* Segmented control */}
          <div className="flex rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]">
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => applyPreset(preset.key)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  preferences.riskAppetite === preset.key
                    ? "bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] z-10"
                    : "bg-transparent text-[#8A8F98] hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Max IL slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8A8F98]">Max Impermanent Loss</span>
              <span className="font-mono text-white">
                {preferences.maxImpermanentLoss}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={preferences.maxImpermanentLoss}
              onChange={(e) =>
                setPreferences({
                  maxImpermanentLoss: Number(e.target.value),
                })
              }
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(255,255,255,0.06)] accent-violet-500"
            />
            <div className="flex justify-between text-xs text-[#4A4F5A] mt-1">
              <span>1%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Max Position Size slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8A8F98]">Max Position Size</span>
              <span className="font-mono text-white">
                {preferences.maxPositionSize}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={preferences.maxPositionSize}
              onChange={(e) =>
                setPreferences({
                  maxPositionSize: Number(e.target.value),
                })
              }
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(255,255,255,0.06)] accent-violet-500"
            />
            <div className="flex justify-between text-xs text-[#4A4F5A] mt-1">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>

        {/* ----------------------------------------------------------------
            START ANALYSIS BUTTON
        ----------------------------------------------------------------- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="pb-8"
        >
          {startError && (
            <div className="mb-4 flex items-center gap-2 text-[#EF4444] text-sm bg-red-950/20 border border-[#EF4444]/20 rounded-xl px-4 py-3 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {startError}
            </div>
          )}

          <button
            onClick={handleStartAnalysis}
            disabled={isStarting || !address}
            className="w-full bg-[#8B5CF6] text-white font-semibold rounded-xl py-4 text-lg hover:brightness-110 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              <>
                Start AI Analysis
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </main>
  );
}