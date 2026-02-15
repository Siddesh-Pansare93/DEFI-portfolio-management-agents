import { WorkflowState, MarketAnalysis } from '../types';
import { getPriceHistory, getAveragePrice } from '../tools/price-fetcher';
import { calculateVolatility } from '../tools/analysis';
import { config } from '../utils/config';

// ============================================================================
// MARKET ANALYZER AGENT
// ============================================================================

/**
 * Market Analyzer Agent
 *
 * Purpose: Analyze market conditions and trends for ETH
 *
 * Tools Used:
 * - getPriceHistory: Fetch 30-day price history from CoinGecko
 * - calculateVolatility: Calculate annualized volatility
 *
 * Analysis:
 * - Trend: bullish (>5% above 30d avg), bearish (<5% below), or neutral
 * - Volatility: stable (<15%), volatile (>35%), or uncertain
 * - Recommendation: increase_eth, decrease_eth, or maintain
 *
 * Output: Market analysis with trend, volatility, and reasoning
 */
export async function runMarketAnalyzer(state: WorkflowState): Promise<WorkflowState> {
  console.log('\n📈 ========================================');
  console.log('📈 AGENT 2: MARKET ANALYZER AGENT');
  console.log('📈 ========================================\n');

  try {
    // Validate that portfolio data exists
    if (!state.portfolio) {
      throw new Error('Portfolio data required for market analysis');
    }

    const currentEthPrice = state.portfolio.holdings.ETH.priceUSD;

    // ========================================================================
    // STEP 1: Fetch 30-day price history
    // ========================================================================

    console.log('📊 Fetching 30-day ETH price history...\n');

    const priceHistory = await getPriceHistory(config.tokenSymbols.ETH, 30);

    if (priceHistory.length < 2) {
      throw new Error('Insufficient price history for analysis');
    }

    // ========================================================================
    // STEP 2: Calculate metrics
    // ========================================================================

    // Calculate average price over 30 days
    const avgPrice = getAveragePrice(priceHistory);

    // Calculate price change percentage
    const priceChangePercent = ((currentEthPrice - avgPrice) / avgPrice) * 100;

    // Calculate volatility
    const volatility = calculateVolatility(priceHistory);

    console.log(`📊 Price Metrics:`);
    console.log(`   Current Price: $${currentEthPrice.toFixed(2)}`);
    console.log(`   30-day Average: $${avgPrice.toFixed(2)}`);
    console.log(`   Price Change: ${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`);
    console.log(`   Volatility: ${volatility.toFixed(2)}%\n`);

    // ========================================================================
    // STEP 3: Determine trend
    // ========================================================================

    let ethTrend: 'bullish' | 'bearish' | 'neutral';

    if (priceChangePercent > 5) {
      ethTrend = 'bullish';
    } else if (priceChangePercent < -5) {
      ethTrend = 'bearish';
    } else {
      ethTrend = 'neutral';
    }

    // ========================================================================
    // STEP 4: Assess market condition
    // ========================================================================

    let marketCondition: 'stable' | 'volatile' | 'uncertain';

    if (volatility < 15) {
      marketCondition = 'stable';
    } else if (volatility > 35) {
      marketCondition = 'volatile';
    } else {
      marketCondition = 'uncertain';
    }

    // ========================================================================
    // STEP 5: Generate recommendation
    // ========================================================================

    let recommendation: 'increase_eth' | 'decrease_eth' | 'maintain';
    let reasoning: string;

    // Decision logic based on trend and volatility
    if (ethTrend === 'bullish' && marketCondition === 'stable') {
      recommendation = 'increase_eth';
      reasoning = `ETH shows strong bullish momentum (${priceChangePercent.toFixed(1)}% above 30-day average) with low volatility (${volatility.toFixed(1)}%). This is a favorable environment for increasing ETH exposure through liquidity provision.`;
    } else if (ethTrend === 'bearish' && marketCondition === 'volatile') {
      recommendation = 'decrease_eth';
      reasoning = `ETH is in a bearish trend (${priceChangePercent.toFixed(1)}% below 30-day average) with high volatility (${volatility.toFixed(1)}%). Consider reducing ETH exposure or maintaining stable positions.`;
    } else if (marketCondition === 'volatile') {
      recommendation = 'maintain';
      reasoning = `High market volatility (${volatility.toFixed(1)}%) suggests caution. ETH trend is ${ethTrend}, but volatile conditions make aggressive positioning risky. Consider maintaining current allocation or using wider price ranges for LP positions.`;
    } else if (ethTrend === 'bullish') {
      recommendation = 'increase_eth';
      reasoning = `ETH shows bullish momentum (${priceChangePercent.toFixed(1)}% above average). Moderate volatility (${volatility.toFixed(1)}%) allows for strategic positioning. Good opportunity for ETH-based strategies.`;
    } else if (ethTrend === 'bearish') {
      recommendation = 'decrease_eth';
      reasoning = `ETH is trending bearish (${priceChangePercent.toFixed(1)}% below average). Consider defensive positioning with more stablecoin allocation or hold current positions.`;
    } else {
      recommendation = 'maintain';
      reasoning = `ETH price is near its 30-day average with moderate volatility (${volatility.toFixed(1)}%). Market is in a balanced state. Maintaining current allocation is prudent while monitoring for clearer trends.`;
    }

    // ========================================================================
    // STEP 6: Construct market analysis object
    // ========================================================================

    const marketAnalysis: MarketAnalysis = {
      ethTrend,
      ethPriceChange30d: priceChangePercent,
      volatility,
      marketCondition,
      recommendation,
      reasoning
    };

    // ========================================================================
    // STEP 7: Log results
    // ========================================================================

    console.log('✅ MARKET ANALYSIS COMPLETE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Trend: ${ethTrend.toUpperCase()}`);
    console.log(`📊 Volatility: ${volatility.toFixed(2)}% (${marketCondition})`);
    console.log(`📊 Recommendation: ${recommendation.replace('_', ' ').toUpperCase()}`);
    console.log(`\n💡 Reasoning: ${reasoning}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================================================
    // STEP 8: Return updated state
    // ========================================================================

    return {
      ...state,
      marketAnalysis
    };

  } catch (error) {
    console.error('❌ Market Analyzer Agent failed:', error);
    throw new Error(`Market Analyzer Agent error: ${(error as Error).message}`);
  }
}
