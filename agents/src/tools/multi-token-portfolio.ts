import { config } from '../utils/config';
import { getEthBalance, getErc20Balance } from './balance-reader';
import { getMultipleTokenPrices } from './price-fetcher';

// ============================================================================
// MULTI-TOKEN PORTFOLIO SUPPORT
// ============================================================================

/**
 * Token balance with metadata
 */
export interface TokenBalance {
  symbol: string;
  balance: number;
  priceUSD: number;
  valueUSD: number;
  address?: string;
}

// ============================================================================
// SIMULATED PORTFOLIO DATA (for demo / Sepolia with low balances)
// ============================================================================

const SIMULATED_HOLDINGS: Record<string, number> = {
  ETH:  15.2,
  USDC: 4200,
  LINK: 500,
  UNI:  120,
  AAVE: 2.5,
  WBTC: 0.015,
  MKR:  0.8,
  CRV:  2500,
};

// Fallback prices if CoinGecko is slow/rate-limited
const FALLBACK_PRICES: Record<string, number> = {
  ETH:  2500,
  USDC: 1.0,
  LINK: 15.0,
  UNI:  9.0,
  AAVE: 250,
  WBTC: 66000,
  MKR:  1800,
  CRV:  0.55,
};

const SIMULATION_THRESHOLD_USD = 500; // If real portfolio < $500, use simulation for demo

/**
 * Comprehensive multi-token portfolio
 */
export interface MultiTokenPortfolio {
  walletAddress: string;
  totalValueUSD: number;
  tokens: TokenBalance[];
  timestamp: Date;
}

/**
 * Get portfolio with all supported tokens
 *
 * @param walletAddress - Ethereum wallet address
 * @param tokenList - Optional list of token symbols to fetch (defaults to all 25)
 * @returns Complete portfolio with all token balances
 *
 * @example
 * const portfolio = await getMultiTokenPortfolio('0x1234...');
 * console.log(`Total: $${portfolio.totalValueUSD}`);
 * portfolio.tokens.forEach(token => {
 *   console.log(`${token.symbol}: ${token.balance} ($${token.valueUSD})`);
 * });
 */
export async function getMultiTokenPortfolio(
  walletAddress: string,
  tokenList?: string[]
): Promise<MultiTokenPortfolio> {
  // Use provided list or default to all tokens
  const tokensToFetch = tokenList || Object.keys(config.tokenSymbols);

  console.log(`📊 Fetching portfolio for ${tokensToFetch.length} tokens...`);

  // Step 1: Fetch all prices in one call (efficient!)
  const coingeckoIds = tokensToFetch.map(symbol =>
    config.tokenSymbols[symbol as keyof typeof config.tokenSymbols]
  ).filter(Boolean);

  const priceMap = await getMultipleTokenPrices(coingeckoIds);

  // Step 2: Fetch balances for each token
  const tokenBalances: TokenBalance[] = [];

  for (const symbol of tokensToFetch) {
    try {
      const coingeckoId = config.tokenSymbols[symbol as keyof typeof config.tokenSymbols];
      if (!coingeckoId) continue;

      const price = priceMap.get(coingeckoId) || 0;

      // Special handling for ETH vs ERC20 tokens
      let balance = 0;
      let tokenAddress: string | undefined;

      if (symbol === 'ETH') {
        balance = await getEthBalance(walletAddress);
      } else {
        // Try to get token address from config
        tokenAddress = config.tokenAddresses[symbol as keyof typeof config.tokenAddresses];

        if (tokenAddress) {
          // Token exists on Sepolia
          balance = await getErc20Balance(walletAddress, tokenAddress);
        } else {
          // Token not available on Sepolia - skip balance fetch
          console.log(`⚠️  ${symbol} not available on Sepolia (price only)`);
          balance = 0;
        }
      }

      const valueUSD = balance * price;

      tokenBalances.push({
        symbol,
        balance,
        priceUSD: price,
        valueUSD,
        address: tokenAddress
      });

    } catch (error) {
      console.error(`Error fetching ${symbol}:`, (error as Error).message);
      // Continue with other tokens even if one fails
    }
  }

  // Step 3: Calculate total portfolio value
  let totalValueUSD = tokenBalances.reduce((sum, token) => sum + token.valueUSD, 0);

  // Step 3.5: SIMULATION FALLBACK — if real portfolio is near-empty, inject demo data
  if (totalValueUSD < SIMULATION_THRESHOLD_USD) {
    console.log(`⚠️  Real portfolio value ($${totalValueUSD.toFixed(2)}) below threshold. Activating simulation mode...`);

    tokenBalances.length = 0; // Clear empty balances

    for (const [symbol, balance] of Object.entries(SIMULATED_HOLDINGS)) {
      const coingeckoId = config.tokenSymbols[symbol as keyof typeof config.tokenSymbols];
      const realPrice = coingeckoId ? (priceMap.get(coingeckoId) || 0) : 0;
      const price = realPrice > 0 ? realPrice : (FALLBACK_PRICES[symbol] || 0);
      const valueUSD = balance * price;

      tokenBalances.push({
        symbol,
        balance,
        priceUSD: price,
        valueUSD,
      });
    }

    totalValueUSD = tokenBalances.reduce((sum, token) => sum + token.valueUSD, 0);
    console.log(`✅ Simulation portfolio loaded: $${totalValueUSD.toFixed(2)} across ${tokenBalances.length} tokens`);
  }

  // Step 4: Sort by value (highest first)
  tokenBalances.sort((a, b) => b.valueUSD - a.valueUSD);

  console.log(`✅ Portfolio fetched: $${totalValueUSD.toFixed(2)} across ${tokenBalances.length} tokens`);

  return {
    walletAddress,
    totalValueUSD,
    tokens: tokenBalances,
    timestamp: new Date()
  };
}

/**
 * Get only tokens with non-zero balances
 *
 * @param walletAddress - Ethereum wallet address
 * @returns Portfolio with only held tokens
 */
export async function getHeldTokensPortfolio(
  walletAddress: string
): Promise<MultiTokenPortfolio> {
  const fullPortfolio = await getMultiTokenPortfolio(walletAddress);

  // Filter out zero balances
  const heldTokens = fullPortfolio.tokens.filter(token => token.balance > 0);

  return {
    ...fullPortfolio,
    tokens: heldTokens
  };
}

/**
 * Get portfolio allocation percentages
 *
 * @param portfolio - Multi-token portfolio
 * @returns Token allocations as percentages
 */
export function getPortfolioAllocation(
  portfolio: MultiTokenPortfolio
): Map<string, number> {
  const allocations = new Map<string, number>();

  if (portfolio.totalValueUSD === 0) {
    return allocations;
  }

  for (const token of portfolio.tokens) {
    const percentage = (token.valueUSD / portfolio.totalValueUSD) * 100;
    allocations.set(token.symbol, percentage);
  }

  return allocations;
}

/**
 * Get top N tokens by value
 *
 * @param portfolio - Multi-token portfolio
 * @param topN - Number of top tokens to return
 * @returns Top N tokens sorted by value
 */
export function getTopTokens(
  portfolio: MultiTokenPortfolio,
  topN: number = 5
): TokenBalance[] {
  return portfolio.tokens
    .filter(token => token.balance > 0)
    .sort((a, b) => b.valueUSD - a.valueUSD)
    .slice(0, topN);
}

/**
 * Calculate portfolio diversification score
 * Higher score = more diversified
 *
 * @param portfolio - Multi-token portfolio
 * @returns Diversification score (0-1)
 */
export function calculateDiversificationScore(
  portfolio: MultiTokenPortfolio
): number {
  const heldTokens = portfolio.tokens.filter(t => t.balance > 0);

  if (heldTokens.length === 0) return 0;
  if (heldTokens.length === 1) return 0;

  // Calculate Herfindahl-Hirschman Index (HHI)
  // Lower HHI = more diversified
  const allocations = getPortfolioAllocation(portfolio);
  let hhi = 0;

  for (const [_, percentage] of allocations) {
    hhi += Math.pow(percentage, 2);
  }

  // Normalize: HHI ranges from 10000 (one token) to 10000/n (perfectly diversified)
  // Convert to 0-1 score where 1 = perfectly diversified
  const maxHHI = 10000;
  const minHHI = 10000 / heldTokens.length;
  const score = 1 - ((hhi - minHHI) / (maxHHI - minHHI));

  return Math.max(0, Math.min(1, score));
}

/**
 * Check if portfolio is balanced (no token > threshold)
 *
 * @param portfolio - Multi-token portfolio
 * @param threshold - Maximum allocation percentage (default: 50%)
 * @returns True if balanced, false if concentrated
 */
export function isPortfolioBalanced(
  portfolio: MultiTokenPortfolio,
  threshold: number = 50
): boolean {
  const allocations = getPortfolioAllocation(portfolio);

  for (const [_, percentage] of allocations) {
    if (percentage > threshold) {
      return false;
    }
  }

  return true;
}
