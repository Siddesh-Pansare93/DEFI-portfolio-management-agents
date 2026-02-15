import axios from 'axios';
import { config } from '../utils/config';
import { retry } from '../utils/retry';
import { PoolData } from '../types';

// ============================================================================
// THE GRAPH QUERY FUNCTIONS
// ============================================================================

/**
 * Get Uniswap V3 pool statistics from The Graph
 *
 * @param poolAddress - Uniswap V3 pool contract address
 * @returns Pool data including liquidity, volume, fees
 *
 * @example
 * const poolData = await getUniswapPoolData('0x6Ce0896eAE38c4fd7aC73dE49B5B40ce7a1d3bB7');
 * console.log(`Pool TVL: $${poolData.liquidity}`);
 * console.log(`24h Volume: $${poolData.volumeUSD}`);
 * console.log(`Fee APR: ${(poolData.feeAPR * 100).toFixed(2)}%`);
 */
export async function getUniswapPoolData(poolAddress: string): Promise<PoolData> {
  return retry(async () => {
    console.log(`🏊 Fetching Uniswap V3 pool data for ${poolAddress.slice(0, 6)}...${poolAddress.slice(-4)}`);

    // GraphQL query for pool data
    const query = `
      {
        pool(id: "${poolAddress.toLowerCase()}") {
          id
          liquidity
          token0Price
          token1Price
          volumeUSD
          feesUSD
          totalValueLockedUSD
          token0 {
            symbol
            decimals
          }
          token1 {
            symbol
            decimals
          }
        }
      }
    `;

    const response = await axios.post(
      config.theGraphUrl,
      { query },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      }
    );

    // Check for GraphQL errors
    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    const pool = response.data.data?.pool;

    if (!pool) {
      throw new Error(`Pool data not found for address ${poolAddress}`);
    }

    // Calculate fee APR
    // APR = (24h fees / TVL) * 365
    const tvl = parseFloat(pool.totalValueLockedUSD);
    const fees24h = parseFloat(pool.feesUSD);
    const feeAPR = tvl > 0 ? (fees24h / tvl) * 365 : 0;

    const poolData: PoolData = {
      address: poolAddress,
      liquidity: tvl,
      token0Price: parseFloat(pool.token0Price),
      token1Price: parseFloat(pool.token1Price),
      volumeUSD: parseFloat(pool.volumeUSD),
      feesUSD: fees24h
    };

    console.log(`✅ Pool Data Retrieved:`);
    console.log(`   ${pool.token0.symbol}/${pool.token1.symbol}`);
    console.log(`   TVL: $${tvl.toLocaleString()}`);
    console.log(`   24h Volume: $${poolData.volumeUSD.toLocaleString()}`);
    console.log(`   24h Fees: $${fees24h.toLocaleString()}`);
    console.log(`   Fee APR: ${(feeAPR * 100).toFixed(2)}%`);

    return poolData;
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Get pool data for multiple pools at once
 *
 * @param poolAddresses - Array of pool addresses
 * @returns Map of pool address to pool data
 */
export async function getMultiplePoolData(
  poolAddresses: string[]
): Promise<Map<string, PoolData>> {
  console.log(`🏊 Fetching data for ${poolAddresses.length} pools...`);

  // Fetch all pools in parallel
  const poolPromises = poolAddresses.map(async (address) => {
    try {
      const data = await getUniswapPoolData(address);
      return { address, data };
    } catch (error) {
      console.error(`Failed to fetch pool ${address}:`, error);
      return null;
    }
  });

  const results = await Promise.all(poolPromises);

  // Convert to Map, filtering out failed requests
  const poolMap = new Map<string, PoolData>();
  results.forEach((result) => {
    if (result) {
      poolMap.set(result.address, result.data);
    }
  });

  console.log(`✅ Retrieved data for ${poolMap.size}/${poolAddresses.length} pools`);
  return poolMap;
}

/**
 * Get top Uniswap V3 pools by TVL
 *
 * @param limit - Maximum number of pools to return
 * @returns Array of pool data sorted by liquidity (descending)
 */
export async function getTopPools(limit: number = 10): Promise<PoolData[]> {
  return retry(async () => {
    console.log(`🏊 Fetching top ${limit} Uniswap V3 pools by TVL...`);

    const query = `
      {
        pools(
          first: ${limit}
          orderBy: totalValueLockedUSD
          orderDirection: desc
        ) {
          id
          liquidity
          token0Price
          token1Price
          volumeUSD
          feesUSD
          totalValueLockedUSD
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
      }
    `;

    const response = await axios.post(
      config.theGraphUrl,
      { query },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    const pools = response.data.data?.pools || [];

    return pools.map((pool: any) => ({
      address: pool.id,
      liquidity: parseFloat(pool.totalValueLockedUSD),
      token0Price: parseFloat(pool.token0Price),
      token1Price: parseFloat(pool.token1Price),
      volumeUSD: parseFloat(pool.volumeUSD),
      feesUSD: parseFloat(pool.feesUSD)
    }));
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Search for pools by token pair
 *
 * @param token0Symbol - First token symbol (e.g., 'WETH')
 * @param token1Symbol - Second token symbol (e.g., 'USDC')
 * @returns Array of matching pools
 */
export async function searchPoolsByTokens(
  token0Symbol: string,
  token1Symbol: string
): Promise<PoolData[]> {
  return retry(async () => {
    console.log(`🔍 Searching for ${token0Symbol}/${token1Symbol} pools...`);

    const query = `
      {
        pools(
          where: {
            token0_: { symbol: "${token0Symbol}" }
            token1_: { symbol: "${token1Symbol}" }
          }
          orderBy: totalValueLockedUSD
          orderDirection: desc
          first: 5
        ) {
          id
          liquidity
          token0Price
          token1Price
          volumeUSD
          feesUSD
          totalValueLockedUSD
          feeTier
        }
      }
    `;

    const response = await axios.post(
      config.theGraphUrl,
      { query },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    const pools = response.data.data?.pools || [];

    console.log(`✅ Found ${pools.length} ${token0Symbol}/${token1Symbol} pools`);

    return pools.map((pool: any) => ({
      address: pool.id,
      liquidity: parseFloat(pool.totalValueLockedUSD),
      token0Price: parseFloat(pool.token0Price),
      token1Price: parseFloat(pool.token1Price),
      volumeUSD: parseFloat(pool.volumeUSD),
      feesUSD: parseFloat(pool.feesUSD)
    }));
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Calculate pool utilization (volume / liquidity ratio)
 * Higher ratio means more active trading
 *
 * @param poolData - Pool data
 * @returns Utilization ratio
 */
export function calculatePoolUtilization(poolData: PoolData): number {
  if (poolData.liquidity === 0) {
    return 0;
  }
  return poolData.volumeUSD / poolData.liquidity;
}

/**
 * Estimate pool fee APR from recent data
 *
 * @param poolData - Pool data
 * @returns Estimated annualized fee APR (0-1, e.g., 0.15 = 15%)
 */
export function estimatePoolFeeAPR(poolData: PoolData): number {
  if (poolData.liquidity === 0) {
    return 0;
  }

  // APR = (24h fees / TVL) * 365
  const dailyFeeRate = poolData.feesUSD / poolData.liquidity;
  const annualizedAPR = dailyFeeRate * 365;

  return annualizedAPR;
}
