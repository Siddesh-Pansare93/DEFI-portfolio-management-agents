import axios from 'axios';

// ============================================================================
// FEAR & GREED INDEX TOOL
// ============================================================================

export interface FearGreedData {
  value: number;        // 0-100 (0 = extreme fear, 100 = extreme greed)
  label: string;        // e.g., "Greed", "Fear", "Neutral"
  trend: 'improving' | 'declining' | 'stable';
}

// Cache (1 hour TTL)
let fgCache: { data: FearGreedData; expires: number } | null = null;
const FG_CACHE_TTL = 60 * 60 * 1000;

/**
 * Get the Crypto Fear & Greed Index
 * Uses Alternative.me API (no key required)
 *
 * @returns Fear & Greed index value, label, and trend
 */
export async function getFearGreedIndex(): Promise<FearGreedData> {
  if (fgCache && fgCache.expires > Date.now()) {
    return fgCache.data;
  }

  try {
    // Fetch current + yesterday to calculate trend
    const response = await axios.get('https://api.alternative.me/fng/?limit=2', {
      timeout: 8000
    });

    const data = response.data?.data;
    if (!data || data.length === 0) {
      return getDefaultFearGreed();
    }

    const current = parseInt(data[0].value);
    const yesterday = data.length > 1 ? parseInt(data[1].value) : current;

    const diff = current - yesterday;
    const trend: 'improving' | 'declining' | 'stable' =
      diff > 3 ? 'improving' : diff < -3 ? 'declining' : 'stable';

    const result: FearGreedData = {
      value: current,
      label: data[0].value_classification,
      trend
    };

    fgCache = { data: result, expires: Date.now() + FG_CACHE_TTL };
    return result;

  } catch (error) {
    console.error('Fear & Greed API error:', (error as Error).message);
    return getDefaultFearGreed();
  }
}

function getDefaultFearGreed(): FearGreedData {
  return { value: 50, label: 'Neutral', trend: 'stable' };
}
