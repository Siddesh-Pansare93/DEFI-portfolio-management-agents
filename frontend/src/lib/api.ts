import { AnalyzeResponse, StatusResponse, PortfolioResponse, LogRecommendationResponse, MarketOverviewResponse, UserPreferences } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Start a new analysis job for a wallet address
 */
export async function startAnalysis(walletAddress: string): Promise<AnalyzeResponse> {
  return startAnalysisWithPreferences(walletAddress);
}

/**
 * Start a new analysis job for a wallet address with optional preferences
 */
export async function startAnalysisWithPreferences(
  walletAddress: string,
  preferences?: Partial<UserPreferences>
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress, preferences }),
  });

  if (!response.ok) {
    throw new Error(`Analysis request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Poll the status of a specific job
 */
export async function getJobStatus(jobId: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch portfolio data directly (optional use)
 */
export async function getPortfolio(walletAddress: string): Promise<PortfolioResponse> {
  const response = await fetch(`${API_BASE_URL}/api/portfolio/${walletAddress}`);

  if (!response.ok) {
    throw new Error(`Portfolio fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get market overview (Fear & Greed, Prices, TVL)
 */
export async function getMarketOverview(): Promise<MarketOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/market-overview`);

  if (!response.ok) {
    throw new Error(`Market overview failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
