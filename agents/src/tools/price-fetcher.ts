import axios from 'axios';
import { config } from '../utils/config';
import { retry } from '../utils/retry';
import { PricePoint } from '../types';

// ============================================================================
// IN-MEMORY PRICE CACHE
// ============================================================================

interface CachedPrice {
  price: number;
  timestamp: number;
}

// Cache map: tokenSymbol -> {price, timestamp}
const priceCache = new Map<string, CachedPrice>();

// ============================================================================
// PRICE FETCHING FUNCTIONS
// ============================================================================

/**
 * Get current USD price for a token from CoinGecko
 * Uses in-memory cache with 5-minute TTL
 *
 * @param tokenSymbol - Token symbol (e.g., 'ethereum', 'usd-coin')
 * @returns Current USD price
 *
 * @example
 * const ethPrice = await getTokenPrice('ethereum');
 * const usdcPrice = await getTokenPrice('usd-coin');
 */
export async function getTokenPrice(tokenSymbol: string): Promise<number> {
  // Normalize token symbol
  const normalizedSymbol = tokenSymbol.toLowerCase();

  // Check cache first
  const cached = priceCache.get(normalizedSymbol);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < config.cacheTimeout) {
    console.log(`💾 Cache hit for ${normalizedSymbol}: $${cached.price}`);
    return cached.price;
  }

  // Cache miss or expired - fetch from CoinGecko
  return retry(async () => {
    console.log(`🌐 Fetching price for ${normalizedSymbol} from CoinGecko...`);

    const response = await axios.get(`${config.coingeckoApiUrl}/simple/price`, {
      params: {
        ids: normalizedSymbol,
        vs_currencies: 'usd'
      },
      timeout: 10000 // 10 second timeout
    });

    const price = response.data[normalizedSymbol]?.usd;

    if (!price) {
      throw new Error(`Price not found for ${normalizedSymbol}`);
    }

    // Update cache
    priceCache.set(normalizedSymbol, {
      price,
      timestamp: now
    });

    console.log(`✅ ${normalizedSymbol.toUpperCase()}: $${price.toFixed(2)}`);
    return price;
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Get historical price data from CoinGecko
 *
 * @param tokenSymbol - Token symbol (e.g., 'ethereum')
 * @param days - Number of days of history (1-365)
 * @returns Array of price points with timestamps
 *
 * @example
 * const history = await getPriceHistory('ethereum', 30);
 * console.log(`30-day price range: ${Math.min(...history.map(p => p.price))} - ${Math.max(...history.map(p => p.price))}`);
 */
export async function getPriceHistory(
  tokenSymbol: string,
  days: number
): Promise<PricePoint[]> {
  const normalizedSymbol = tokenSymbol.toLowerCase();

  return retry(async () => {
    console.log(`📈 Fetching ${days}-day price history for ${normalizedSymbol}...`);

    const response = await axios.get(
      `${config.coingeckoApiUrl}/coins/${normalizedSymbol}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily'
        },
        timeout: 15000 // 15 second timeout for historical data
      }
    );

    if (!response.data.prices || !Array.isArray(response.data.prices)) {
      throw new Error(`Invalid price history data for ${normalizedSymbol}`);
    }

    // Convert to PricePoint array
    const pricePoints: PricePoint[] = response.data.prices.map(
      ([timestamp, price]: [number, number]) => ({
        timestamp,
        price
      })
    );

    console.log(`✅ Retrieved ${pricePoints.length} price points for ${normalizedSymbol}`);
    return pricePoints;
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Get prices for multiple tokens at once
 * More efficient than calling getTokenPrice multiple times
 *
 * @param tokenSymbols - Array of token symbols
 * @returns Map of token symbol to price
 *
 * @example
 * const prices = await getMultipleTokenPrices(['ethereum', 'usd-coin', 'dai']);
 * console.log(`ETH: $${prices.get('ethereum')}`);
 */
export async function getMultipleTokenPrices(
  tokenSymbols: string[]
): Promise<Map<string, number>> {
  const normalizedSymbols = tokenSymbols.map(s => s.toLowerCase());

  return retry(async () => {
    console.log(`🌐 Fetching prices for ${normalizedSymbols.length} tokens...`);

    const response = await axios.get(`${config.coingeckoApiUrl}/simple/price`, {
      params: {
        ids: normalizedSymbols.join(','),
        vs_currencies: 'usd'
      },
      timeout: 10000
    });

    const priceMap = new Map<string, number>();
    const now = Date.now();

    for (const symbol of normalizedSymbols) {
      const price = response.data[symbol]?.usd;
      if (price) {
        priceMap.set(symbol, price);

        // Update cache
        priceCache.set(symbol, { price, timestamp: now });
      }
    }

    console.log(`✅ Fetched ${priceMap.size}/${normalizedSymbols.length} prices`);
    return priceMap;
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Calculate price change percentage over a period
 *
 * @param pricePoints - Array of historical price points
 * @returns Percentage change from first to last price
 */
export function calculatePriceChange(pricePoints: PricePoint[]): number {
  if (pricePoints.length < 2) {
    return 0;
  }

  const firstPrice = pricePoints[0].price;
  const lastPrice = pricePoints[pricePoints.length - 1].price;

  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

/**
 * Get average price over a period
 *
 * @param pricePoints - Array of historical price points
 * @returns Average price
 */
export function getAveragePrice(pricePoints: PricePoint[]): number {
  if (pricePoints.length === 0) {
    return 0;
  }

  const sum = pricePoints.reduce((acc, point) => acc + point.price, 0);
  return sum / pricePoints.length;
}

/**
 * Clear the price cache
 * Useful for testing or forcing fresh data fetch
 */
export function clearPriceCache(): void {
  priceCache.clear();
  console.log('🗑️  Price cache cleared');
}

/**
 * Get cache statistics
 * Useful for monitoring cache performance
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ symbol: string; price: number; age: number }>;
} {
  const now = Date.now();
  const entries = Array.from(priceCache.entries()).map(([symbol, data]) => ({
    symbol,
    price: data.price,
    age: Math.floor((now - data.timestamp) / 1000) // Age in seconds
  }));

  return {
    size: priceCache.size,
    entries
  };
}
