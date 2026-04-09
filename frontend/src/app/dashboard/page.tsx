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
import { Wallet, AlertCircle, Loader2, TrendingUp } from "lucide-react";
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
  if (index < 25) return "bg-red-500 text-white";
  if (index < 45) return "bg-amber-500 text-[#0F172A]";
  if (index < 55) return "bg-green-500 text-[#0F172A]";
  if (index < 75) return "bg-amber-500 text-[#0F172A]";
  return "bg-red-500 text-white";
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
      <main className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full bg-[#222735] border border-[#334155] rounded-2xl p-8 text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <h2 className="font-sans font-bold text-2xl text-white">
              Connect Your Wallet
            </h2>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Please connect your wallet to access the Autonomous DeFi Command Center.
            </p>
            <p className="text-[#F59E0B] text-sm animate-pulse">
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
    <main className="min-h-screen flex flex-col">
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
          <h1 className="font-sans font-bold text-3xl text-white">
            Command Center
          </h1>
          <p className="font-mono text-sm text-[#94A3B8] mt-1">
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
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* Fear & Greed */}
          <div className="bg-[#222735] border border-[#334155] rounded-2xl p-5 flex flex-col gap-2">
            <span className="text-[#94A3B8] text-xs uppercase tracking-wider">
              Fear &amp; Greed
            </span>
            {isMarketLoading ? (
              <div className="h-8 w-24 rounded bg-[#334155] animate-pulse" />
            ) : marketError ? (
              <span className="text-red-400 text-sm">{marketError}</span>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${fearGreedColor(
                    marketData?.fearGreedIndex ?? 50
                  )}`}
                >
                  {marketData?.fearGreedIndex ?? "--"}
                </span>
                <span className="text-[#94A3B8] text-sm">
                  {marketData?.fearGreedLabel ?? ""}
                </span>
              </div>
            )}
          </div>

          {/* ETH Price */}
          <div className="bg-[#222735] border border-[#334155] rounded-2xl p-5 flex flex-col gap-2">
            <span className="text-[#94A3B8] text-xs uppercase tracking-wider">
              ETH Price
            </span>
            {isMarketLoading ? (
              <div className="h-8 w-32 rounded bg-[#334155] animate-pulse" />
            ) : (
              <span className="font-mono text-xl text-white">
                {marketData?.ethPrice
                  ? `$${marketData.ethPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "--"}
              </span>
            )}
          </div>

          {/* Uniswap TVL */}
          <div className="bg-[#222735] border border-[#334155] rounded-2xl p-5 flex flex-col gap-2">
            <span className="text-[#94A3B8] text-xs uppercase tracking-wider">
              Uniswap TVL
            </span>
            {isMarketLoading ? (
              <div className="h-8 w-28 rounded bg-[#334155] animate-pulse" />
            ) : (
              <span className="font-mono text-xl text-white">
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
          className="bg-[#222735] border border-[#334155] rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#94A3B8]" />
            <span className="text-[#94A3B8] text-sm font-medium">
              Portfolio Value
            </span>
          </div>

          {isPortfolioLoading ? (
            <div className="h-12 w-48 rounded bg-[#334155] animate-pulse" />
          ) : portfolioError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {portfolioError}
            </div>
          ) : (
            <span className="text-[#F59E0B] font-mono text-4xl font-bold">
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
            className="bg-[#222735] border border-[#334155] rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#334155]">
              <h2 className="font-sans font-semibold text-lg text-white">
                Holdings
              </h2>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-4 px-6 py-3 text-[#94A3B8] text-xs uppercase tracking-wider border-b border-[#334155]">
              <span>Token</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Price</span>
              <span className="text-right">Value</span>
            </div>

            {/* Table rows */}
            {tokenEntries.map(([symbol, holding], idx) => (
              <div
                key={symbol}
                className={`grid grid-cols-4 px-6 py-3.5 items-center ${
                  idx % 2 === 0 ? "bg-[#222735]" : "bg-[#272F42]"
                }`}
              >
                <span className="text-white font-medium">{symbol}</span>
                <span className="text-right font-mono text-white text-sm">
                  {holding.balance < 0.0001
                    ? holding.balance.toExponential(2)
                    : holding.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                </span>
                <span className="text-right font-mono text-[#94A3B8] text-sm">
                  {formatUSD(holding.priceUSD)}
                </span>
                <span className="text-right font-mono text-white text-sm">
                  {formatUSD(holding.valueUSD)}
                </span>
              </div>
            ))}
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
          className="bg-[#222735] border border-[#334155] rounded-2xl p-6 md:p-8 space-y-6"
        >
          <h2 className="font-sans font-semibold text-lg text-white">
            Risk Preferences
          </h2>

          {/* Segmented control */}
          <div className="flex rounded-xl overflow-hidden border border-[#334155]">
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => applyPreset(preset.key)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  preferences.riskAppetite === preset.key
                    ? "bg-[#F59E0B] text-[#0F172A]"
                    : "bg-[#222735] text-[#94A3B8] hover:bg-[#272F42]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Max IL slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Max Impermanent Loss</span>
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
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#334155] accent-[#F59E0B]"
            />
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>1%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Max Position Size slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Max Position Size</span>
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
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#334155] accent-[#F59E0B]"
            />
            <div className="flex justify-between text-xs text-[#64748B]">
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
        >
          {startError && (
            <div className="mb-3 flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {startError}
            </div>
          )}

          <button
            onClick={handleStartAnalysis}
            disabled={isStarting || !address}
            className="w-full bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl py-4 text-lg hover:bg-[#FBBF24] transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              "Start Analysis"
            )}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
