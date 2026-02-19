import axios from 'axios';

// ============================================================================
// DEFILLAMA TVL TOOL
// ============================================================================

export interface UniswapTVL {
  total: number;       // TVL in USD
  change24h: number;   // 24h change as percentage
}

// Cache: 5 minutes
const tvlCache = new Map<string, { data: any; expires: number }>();
const TVL_CACHE_TTL = 5 * 60 * 1000;

/**
 * Get Uniswap protocol TVL from DeFiLlama
 * No API key required
 *
 * @returns Uniswap total TVL and 24h change
 */
export async function getUniswapTVL(): Promise<UniswapTVL> {
  const cacheKey = 'uniswap_tvl';
  const cached = tvlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  try {
    const response = await axios.get('https://api.llama.fi/protocol/uniswap', {
      timeout: 10000
    });

    const data = response.data;
    const currentTVL = data.currentChainTvls?.Ethereum || data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD || 0;

    // Calculate 24h change from tvl array if available
    let change24h = 0;
    if (data.tvl && data.tvl.length >= 2) {
      const latestTVL = data.tvl[data.tvl.length - 1]?.totalLiquidityUSD || 0;
      const prevTVL = data.tvl[data.tvl.length - 2]?.totalLiquidityUSD || latestTVL;
      change24h = prevTVL > 0 ? ((latestTVL - prevTVL) / prevTVL) * 100 : 0;
    }

    const result: UniswapTVL = {
      total: currentTVL,
      change24h
    };

    tvlCache.set(cacheKey, { data: result, expires: Date.now() + TVL_CACHE_TTL });
    return result;

  } catch (error) {
    console.error('DeFiLlama Uniswap TVL error:', (error as Error).message);
    return { total: 4_200_000_000, change24h: 0 }; // Approximate fallback
  }
}

/**
 * Get global DeFi TVL from DeFiLlama
 *
 * @returns Global DeFi TVL in USD
 */
export async function getGlobalDeFiTVL(): Promise<{ total: number }> {
  const cacheKey = 'global_tvl';
  const cached = tvlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  try {
    const response = await axios.get('https://api.llama.fi/tvl', {
      timeout: 10000
    });

    // Response is a number
    const total = typeof response.data === 'number' ? response.data : 0;
    const result = { total };

    tvlCache.set(cacheKey, { data: result, expires: Date.now() + TVL_CACHE_TTL });
    return result;

  } catch (error) {
    console.error('DeFiLlama global TVL error:', (error as Error).message);
    return { total: 90_000_000_000 }; // ~$90B fallback
  }
}
