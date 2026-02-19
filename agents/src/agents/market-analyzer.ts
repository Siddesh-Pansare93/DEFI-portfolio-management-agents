import { WorkflowState, DeepMarketAnalysis } from '../types';
import { getPriceHistory, getAveragePrice } from '../tools/price-fetcher';
import { calculateVolatility } from '../tools/analysis';
import { getCryptoNews, calculateNewsSentiment } from '../tools/news-fetcher';
import { getFearGreedIndex } from '../tools/fear-greed';
import { getUniswapTVL } from '../tools/defi-llama';
import { performFullTechnicalAnalysis } from '../tools/technical-analysis';
import { config } from '../utils/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// ============================================================================
// MARKET ANALYZER AGENT (Gemini LLM + Deterministic Fallback)
// ============================================================================

/**
 * Market Analyzer Agent
 *
 * Purpose: Comprehensive market analysis using:
 * - 30-day price history + technical indicators (RSI, MACD, Bollinger Bands)
 * - News sentiment from NewsAPI
 * - Fear & Greed Index
 * - Uniswap TVL from DeFiLlama
 * - Gemini LLM for synthesis and reasoning
 *
 * Output: DeepMarketAnalysis with all indicators + LLM reasoning
 */
export async function runMarketAnalyzer(state: WorkflowState): Promise<WorkflowState> {
  console.log('\n📈 ========================================');
  console.log('📈 AGENT 2: MARKET ANALYZER AGENT');
  console.log('📈 ========================================\n');

  try {
    if (!state.portfolio) {
      throw new Error('Portfolio data required for market analysis');
    }

    // ========================================================================
    // STEP 1: Fetch all data in parallel
    // ========================================================================

    console.log('📊 Gathering market data...\n');

    const dominantToken = state.portfolio.dominantToken || 'ETH';
    const topHoldings = state.portfolio.topHoldings || ['ETH'];

    const [
      ethPriceHistory,
      fearGreed,
      uniswapTVL,
      newsItems
    ] = await Promise.all([
      getPriceHistory(config.tokenSymbols.ETH, 30),
      getFearGreedIndex(),
      getUniswapTVL(),
      getCryptoNews(`${dominantToken} ethereum DeFi cryptocurrency`, 10)
    ]);

    // ========================================================================
    // STEP 2: Calculate metrics
    // ========================================================================

    const ethPrices = ethPriceHistory.map(p => p.price);
    const currentEthPrice = state.portfolio.holdings['ETH']?.priceUSD
      || ethPrices[ethPrices.length - 1]
      || 0;

    const avgPrice = getAveragePrice(ethPriceHistory);
    const priceChangePercent = avgPrice > 0 ? ((currentEthPrice - avgPrice) / avgPrice) * 100 : 0;
    const volatility = calculateVolatility(ethPriceHistory);
    const technicalAnalysis = performFullTechnicalAnalysis(ethPrices);
    const sentimentScore = calculateNewsSentiment(newsItems);

    console.log(`📊 Price: $${currentEthPrice.toFixed(2)} | 30d change: ${priceChangePercent.toFixed(2)}%`);
    console.log(`📊 Volatility: ${volatility.toFixed(2)}% | RSI: ${technicalAnalysis.rsi.toFixed(1)}`);
    console.log(`📊 Fear & Greed: ${fearGreed.value} (${fearGreed.label})`);
    console.log(`📊 Uniswap TVL: $${(uniswapTVL.total / 1e9).toFixed(2)}B`);
    console.log(`📊 News Sentiment: ${sentimentScore.toFixed(2)}\n`);

    // ========================================================================
    // STEP 3: Try Gemini analysis
    // ========================================================================

    let geminiReasoning = '';
    let marketAnalysis: DeepMarketAnalysis;

    try {
      geminiReasoning = await analyzeWithGemini({
        currentEthPrice,
        priceChangePercent,
        volatility,
        technicalAnalysis,
        fearGreed,
        uniswapTVL,
        sentimentScore,
        newsHeadlines: newsItems.slice(0, 5).map(n => n.title)
      });
      console.log('✅ Gemini analysis complete\n');
    } catch (err) {
      console.warn('⚠️  Gemini analysis failed, using deterministic fallback:', (err as Error).message);
      geminiReasoning = generateDeterministicReasoning(priceChangePercent, volatility, fearGreed.value, sentimentScore);
    }

    // ========================================================================
    // STEP 4: Determine trend and condition (deterministic safety net)
    // ========================================================================

    const ethTrend = priceChangePercent > 5 ? 'bullish'
      : priceChangePercent < -5 ? 'bearish'
      : 'neutral';

    const marketCondition = volatility < 15 ? 'stable'
      : volatility > 35 ? 'volatile'
      : 'uncertain';

    const recommendation = determineRecommendation(
      ethTrend,
      marketCondition,
      technicalAnalysis.signal,
      fearGreed.value
    );

    const macroSignal = fearGreed.value > 60 && sentimentScore > 0 ? 'risk_on'
      : fearGreed.value < 40 && sentimentScore < 0 ? 'risk_off'
      : 'neutral';

    const analysisConfidence = calculateConfidence(
      volatility, fearGreed.value, technicalAnalysis.rsi, newsItems.length
    );

    // ========================================================================
    // STEP 5: Build analysis object
    // ========================================================================

    marketAnalysis = {
      ethTrend,
      ethPriceChange30d: priceChangePercent,
      volatility,
      marketCondition,
      recommendation,
      fearGreedIndex: fearGreed.value,
      fearGreedLabel: fearGreed.label,
      sentimentScore,
      newsHeadlines: newsItems.slice(0, 5),
      technicalIndicators: {
        rsi: technicalAnalysis.rsi,
        macd: technicalAnalysis.macd,
        bollingerBands: technicalAnalysis.bollingerBands,
        ema7: technicalAnalysis.ema7,
        ema30: technicalAnalysis.ema30,
        signal: technicalAnalysis.signal
      },
      uniswapTVL: uniswapTVL.total,
      uniswapTVLChange24h: uniswapTVL.change24h,
      supportLevel: technicalAnalysis.supportResistance.support,
      resistanceLevel: technicalAnalysis.supportResistance.resistance,
      macroSignal,
      analysisConfidence,
      geminiReasoning,
      reasoning: geminiReasoning
    };

    // ========================================================================
    // STEP 6: Log results
    // ========================================================================

    console.log('✅ MARKET ANALYSIS COMPLETE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Trend: ${ethTrend.toUpperCase()} | Condition: ${marketCondition.toUpperCase()}`);
    console.log(`📊 Technical Signal: ${technicalAnalysis.signal.replace('_', ' ').toUpperCase()}`);
    console.log(`📊 Macro Signal: ${macroSignal.toUpperCase()}`);
    console.log(`📊 Recommendation: ${recommendation.replace('_', ' ').toUpperCase()}`);
    console.log(`📊 Confidence: ${(analysisConfidence * 100).toFixed(0)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      ...state,
      marketAnalysis,
      deepMarketAnalysis: marketAnalysis
    };

  } catch (error) {
    console.error('❌ Market Analyzer Agent failed:', error);
    throw new Error(`Market Analyzer Agent error: ${(error as Error).message}`);
  }
}

// ============================================================================
// GEMINI ANALYSIS
// ============================================================================

interface MarketData {
  currentEthPrice: number;
  priceChangePercent: number;
  volatility: number;
  technicalAnalysis: any;
  fearGreed: { value: number; label: string };
  uniswapTVL: { total: number; change24h: number };
  sentimentScore: number;
  newsHeadlines: string[];
}

async function analyzeWithGemini(data: MarketData): Promise<string> {
  const llm = new ChatGoogleGenerativeAI({
    model: config.geminiModel,
    apiKey: config.googleApiKey,
    temperature: 0.3,
  });

  const systemPrompt = `You are a senior DeFi market analyst with expertise in technical analysis, on-chain metrics, and macroeconomic signals. Be concise but specific. Always cite the exact data values provided.`;

  const userPrompt = `Analyze current DeFi market conditions and provide a 3-paragraph assessment:

PRICE DATA:
- Current ETH: $${data.currentEthPrice.toFixed(2)}
- 30d price change: ${data.priceChangePercent.toFixed(2)}%
- Annualized volatility: ${data.volatility.toFixed(2)}%

TECHNICAL INDICATORS:
- RSI(14): ${data.technicalAnalysis.rsi.toFixed(1)} ${data.technicalAnalysis.rsi > 70 ? '(overbought)' : data.technicalAnalysis.rsi < 30 ? '(oversold)' : '(neutral)'}
- MACD: ${data.technicalAnalysis.macd.value.toFixed(2)}, Signal: ${data.technicalAnalysis.macd.signal.toFixed(2)}, Hist: ${data.technicalAnalysis.macd.histogram.toFixed(2)}
- Bollinger %B: ${data.technicalAnalysis.bollingerBands.percentB?.toFixed(2) || 'N/A'}
- Technical signal: ${data.technicalAnalysis.signal}
- Price vs EMA7: ${data.technicalAnalysis.priceVsEma7?.toFixed(2) || '0'}%

SENTIMENT & MACRO:
- Fear & Greed: ${data.fearGreed.value} (${data.fearGreed.label})
- News sentiment: ${data.sentimentScore.toFixed(2)} (scale: -1 bearish to +1 bullish)
- Uniswap V3 TVL: $${(data.uniswapTVL.total / 1e9).toFixed(2)}B (${data.uniswapTVL.change24h.toFixed(2)}% 24h)

TOP HEADLINES: ${data.newsHeadlines.slice(0, 3).join(' | ')}

Write 3 paragraphs: (1) Technical picture, (2) Sentiment/macro picture, (3) Overall assessment for a DeFi LP provider.`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ]);

  return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
}

// ============================================================================
// DETERMINISTIC HELPERS
// ============================================================================

function determineRecommendation(
  trend: string,
  condition: string,
  technicalSignal: string,
  fearGreed: number
): 'increase_eth' | 'decrease_eth' | 'maintain' {
  if ((trend === 'bullish' || technicalSignal.includes('buy')) && condition !== 'volatile') {
    return 'increase_eth';
  }
  if ((trend === 'bearish' || technicalSignal.includes('sell')) && fearGreed < 30) {
    return 'decrease_eth';
  }
  return 'maintain';
}

function calculateConfidence(
  volatility: number,
  fearGreed: number,
  rsi: number,
  newsCount: number
): number {
  let confidence = 0.7; // Base confidence

  // Lower confidence in high volatility
  if (volatility > 50) confidence -= 0.2;
  else if (volatility < 20) confidence += 0.1;

  // Higher confidence with more news data
  if (newsCount > 5) confidence += 0.1;
  if (newsCount === 0) confidence -= 0.15;

  // Neutral RSI = higher confidence
  if (rsi > 40 && rsi < 60) confidence += 0.05;

  return Math.max(0.3, Math.min(0.95, confidence));
}

function generateDeterministicReasoning(
  priceChange: number,
  volatility: number,
  fearGreed: number,
  sentiment: number
): string {
  const trendText = priceChange > 5 ? 'bullish momentum' : priceChange < -5 ? 'bearish pressure' : 'sideways consolidation';
  const volText = volatility > 35 ? 'high volatility' : volatility < 15 ? 'low volatility' : 'moderate volatility';
  const fgText = fearGreed > 60 ? 'greed-driven market' : fearGreed < 40 ? 'fear-driven market' : 'balanced sentiment';

  return `ETH shows ${trendText} with ${priceChange.toFixed(1)}% 30-day price change. Market exhibits ${volText} at ${volatility.toFixed(1)}% annualized. ` +
    `Macro sentiment is ${fgText} (F&G: ${fearGreed}/100) with news sentiment at ${sentiment.toFixed(2)}. ` +
    `${volatility > 35 ? 'High volatility warrants caution for new LP positions.' : 'Current conditions suggest monitoring price action before committing capital.'}`;
}
