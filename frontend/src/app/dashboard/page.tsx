"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { 
  getMarketOverview, 
  getPortfolio 
} from "@/lib/api";
import { MarketOverviewResponse, PortfolioResponse } from "@/lib/types";
import { usePreferences } from "@/hooks/usePreferences";

// Components
import { MarketPulseBar } from "@/components/dashboard/MarketPulseBar";
import { PortfolioValueCard } from "@/components/dashboard/PortfolioValueCard";
import { TokenHoldingsTable } from "@/components/dashboard/TokenHoldingsTable";
import { RiskPreferencesPanel } from "@/components/dashboard/RiskPreferencesPanel";
import { StartAnalysisButton } from "@/components/dashboard/StartAnalysisButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  // State for data
  const [marketData, setMarketData] = useState<MarketOverviewResponse | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioResponse | null>(null);
  
  // Loading states
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  
  // Error states
  const [marketError, setMarketError] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Preferences Hook
  const { preferences, updatePreference, applyPreset } = usePreferences();

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      // router.push("/"); // Uncomment to enforce auth, but for now we might show a "Connect Wallet" state
    }
  }, [isConnected, router]);

  // Fetch Market Data
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

  // Fetch Portfolio Data
  useEffect(() => {
    if (!address) return;

    const fetchPortfolio = async () => {
      try {
        setIsPortfolioLoading(true);
        // Reset previous data when switching wallets
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

  // If not connected, show a simple prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-neon-cyan/50 bg-black/80 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-orbitron text-neon-cyan">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="p-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
              <Wallet className="w-12 h-12 text-neon-cyan" />
            </div>
            <p className="text-gray-400 text-center">
              Please connect your wallet to access the Autonomous DeFi Dashboard.
            </p>
            {/* The actual connect button is in the navbar, but we can instruct users */}
            <div className="text-sm text-neon-purple animate-pulse">
              ↗ Connect Wallet in Top Right
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-neon-cyan to-neon-blue">
            COMMAND CENTER
          </h1>
          <p className="text-gray-400 mt-1 font-mono text-sm">
            Welcome back, <span className="text-neon-cyan">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </p>
        </div>
        
        {/* Market Pulse Bar (Top Right or Full Width on Mobile) */}
        <div className="w-full md:w-auto">
           <MarketPulseBar 
             fearGreedIndex={marketData?.fearGreedIndex || 50}
             fearGreedLabel={marketData?.fearGreedLabel || "Neutral"}
             ethPrice={marketData?.ethPrice || 0}
             uniswapTVL={marketData?.uniswapTVL || 0}
           /> 
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Portfolio & Holdings (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Portfolio Value Card */}
          {isPortfolioLoading ? (
            <Skeleton className="h-48 w-full bg-gray-900/50 rounded-xl" />
          ) : portfolioError ? (
             <Alert variant="destructive" className="border-red-900 bg-red-900/20 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{portfolioError}</AlertDescription>
            </Alert>
          ) : (
            <PortfolioValueCard 
              totalValueUSD={portfolioData?.totalValueUSD || 0}
              change24h={0} // Backend doesn't provide 24h change yet
            />
          )}

          {/* Token Holdings Table */}
          {isPortfolioLoading ? (
            <Skeleton className="h-96 w-full bg-gray-900/50 rounded-xl" />
          ) : (
            <TokenHoldingsTable 
              holdings={portfolioData?.holdings || {}} 
              totalValueUSD={portfolioData?.totalValueUSD || 1}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Action & Preferences (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Risk Preferences Panel */}
          <RiskPreferencesPanel 
            preferences={preferences}
            onUpdate={updatePreference}
            onApplyPreset={applyPreset}
          />

          {/* Start Analysis Button (Sticky on mobile bottom?) */}
          <div className="sticky bottom-4 z-10 md:static">
             <StartAnalysisButton 
               walletAddress={address || ""}
               preferences={preferences}
             />
          </div>
        </div>
      </div>
    </div>
  );
}
