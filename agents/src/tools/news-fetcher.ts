import axios from 'axios';
import { config } from '../utils/config';

// ============================================================================
// NEWS FETCHER TOOL
// ============================================================================

export interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

// Simple in-memory cache
const newsCache = new Map<string, { data: NewsItem[]; expires: number }>();
const NEWS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const BULLISH_KEYWORDS = [
  'surge', 'soar', 'rally', 'bull', 'breakout', 'gain', 'rise', 'record',
  'adoption', 'partnership', 'launch', 'upgrade', 'positive', 'growth',
  'institutional', 'buy', 'accumulate', 'optimistic', 'all-time high', 'ath'
];

const BEARISH_KEYWORDS = [
  'crash', 'drop', 'fall', 'bear', 'sell', 'decline', 'plunge', 'dump',
  'hack', 'exploit', 'ban', 'regulation', 'concern', 'risk', 'warning',
  'liquidation', 'panic', 'fear', 'correction', 'down', 'loss'
];

/**
 * Classify sentiment of a news article
 */
function classifySentiment(title: string, description: string): 'bullish' | 'bearish' | 'neutral' {
  const text = (title + ' ' + description).toLowerCase();

  let bullishCount = BULLISH_KEYWORDS.filter(kw => text.includes(kw)).length;
  let bearishCount = BEARISH_KEYWORDS.filter(kw => text.includes(kw)).length;

  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

/**
 * Fetch crypto news from NewsAPI
 *
 * @param query - Search query (e.g., "ethereum DeFi")
 * @param pageSize - Number of articles (default 10)
 * @returns Array of news items with sentiment
 */
export async function getCryptoNews(query: string, pageSize = 10): Promise<NewsItem[]> {
  const cacheKey = `news_${query}_${pageSize}`;
  const cached = newsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  if (!config.newsApiKey) {
    console.warn('NEWS_API_KEY not set, returning empty news');
    return [];
  }

  try {
    const url = `https://newsapi.org/v2/everything`;
    const response = await axios.get(url, {
      params: {
        q: query,
        apiKey: config.newsApiKey,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize
      },
      timeout: 10000
    });

    const articles = response.data.articles || [];

    const newsItems: NewsItem[] = articles.map((article: any) => ({
      title: article.title || '',
      description: article.description || '',
      source: article.source?.name || 'Unknown',
      url: article.url || '',
      publishedAt: new Date(article.publishedAt),
      sentiment: classifySentiment(article.title || '', article.description || '')
    }));

    newsCache.set(cacheKey, { data: newsItems, expires: Date.now() + NEWS_CACHE_TTL });
    return newsItems;

  } catch (error) {
    console.error('NewsAPI error:', (error as Error).message);
    return [];
  }
}

/**
 * Fetch news for multiple tokens (batched)
 *
 * @param tokens - Array of token symbols (e.g., ['ETH', 'UNI'])
 * @returns Map of symbol -> news items
 */
export async function getMultiTokenNews(
  tokens: string[]
): Promise<Record<string, NewsItem[]>> {
  const result: Record<string, NewsItem[]> = {};

  // Only fetch for top 5 tokens to avoid rate limits
  const tokensToFetch = tokens.slice(0, 5);

  await Promise.all(
    tokensToFetch.map(async (token) => {
      const query = `${token} cryptocurrency DeFi`;
      result[token] = await getCryptoNews(query, 5);
    })
  );

  return result;
}

/**
 * Calculate aggregate sentiment score from news articles
 *
 * @param articles - Array of news items
 * @returns Sentiment score from -1 (very bearish) to +1 (very bullish)
 */
export function calculateNewsSentiment(articles: NewsItem[]): number {
  if (articles.length === 0) return 0;

  let score = 0;
  for (const article of articles) {
    if (article.sentiment === 'bullish') score += 1;
    else if (article.sentiment === 'bearish') score -= 1;
  }

  return score / articles.length; // Normalized -1 to +1
}
