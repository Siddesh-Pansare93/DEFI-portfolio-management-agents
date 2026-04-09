import { config } from '../utils/config';
import { WorkflowState, PortfolioData } from '../types';
import { getUniswapPoolData } from '../tools/pool-data';
import { getMultiTokenPortfolio, calculateDiversificationScore, getTopTokens } from '../tools/multi-token-portfolio';

// ============================================================================
// DATA COLLECTION AGENT (Multi-Token)
// ============================================================================

/**
 * Data Collection Agent
 *
 * Purpose: Gather complete portfolio data for ALL 25 supported tokens
 *
 * Tools Used:
 * - getMultiTokenPortfolio: Fetch all token balances + prices in one call
 * - getUniswapPoolData: Get Uniswap V3 pool statistics
 *
 * Output: Complete portfolio snapshot with all token holdings and pool data
 */
export async function runDataCollector(state: WorkflowState): Promise<WorkflowState> {
  console.log('\n📊 ========================================');
  console.log('📊 AGENT 1: DATA COLLECTION AGENT');
  console.log('📊 ========================================\n');

  try {
    const { walletAddress } = state;

    // ========================================================================
    // STEP 1: Fetch multi-token portfolio (all 25 tokens)
    // ========================================================================

    console.log('🔍 Fetching multi-token portfolio data...\n');

    const [multiPortfolio, poolData] = await Promise.all([
      getMultiTokenPortfolio(walletAddress),
      getUniswapPoolData(config.uniswapPoolAddress)
    ]);

    // ========================================================================
    // STEP 2: Build holdings Record<string, TokenHolding>
    // ========================================================================

    const holdings: Record<string, { balance: number; priceUSD: number; valueUSD: number }> = {};
    const allocationPercent: Record<string, number> = {};

    for (const token of multiPortfolio.tokens) {
      holdings[token.symbol] = {
        balance: token.balance,
        priceUSD: token.priceUSD,
        valueUSD: token.valueUSD
      };

      allocationPercent[token.symbol] = multiPortfolio.totalValueUSD > 0
        ? (token.valueUSD / multiPortfolio.totalValueUSD) * 100
        : 0;
    }

    // ========================================================================
    // STEP 3: Calculate top holdings and dominant token
    // ========================================================================

    const topTokensList = getTopTokens(multiPortfolio, 5);
    const topHoldings = topTokensList.map(t => t.symbol);
    const dominantToken = topHoldings.length > 0 ? topHoldings[0] : 'ETH';

    // ========================================================================
    // STEP 4: Calculate diversification score
    // ========================================================================

    const diversificationScore = calculateDiversificationScore(multiPortfolio);

    // ========================================================================
    // STEP 5: Calculate pool fee APR
    // ========================================================================

    const feeAPR = poolData.liquidity > 0
      ? (poolData.feesUSD / poolData.liquidity) * 365
      : 0;

    // ========================================================================
    // STEP 6: Build PortfolioData object
    // ========================================================================

    const portfolio: PortfolioData = {
      holdings,
      topHoldings,
      totalValueUSD: multiPortfolio.totalValueUSD,
      allocationPercent,
      dominantToken,
      uniswapPool: {
        address: config.uniswapPoolAddress,
        liquidity: poolData.liquidity,
        volume24h: poolData.volumeUSD,
        feeAPR
      },
      diversificationScore
    };

    // ========================================================================
    // STEP 7: Log results
    // ========================================================================

    console.log('\n✅ PORTFOLIO DATA COLLECTED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💰 Total Portfolio Value: $${multiPortfolio.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`📊 Diversification Score: ${(diversificationScore * 100).toFixed(0)}/100`);
    console.log(`🏆 Dominant Token: ${dominantToken}`);

    if (topHoldings.length > 0) {
      console.log('\n📊 Top Holdings:');
      topTokensList.forEach(token => {
        console.log(`   ${token.symbol}: ${token.balance.toFixed(4)} @ $${token.priceUSD.toFixed(2)} = $${token.valueUSD.toFixed(2)} (${allocationPercent[token.symbol]?.toFixed(1) || 0}%)`);
      });
    }

    console.log('\n🏊 Uniswap ETH-USDC Pool:');
    console.log(`   TVL: $${poolData.liquidity.toLocaleString()}`);
    console.log(`   24h Volume: $${poolData.volumeUSD.toLocaleString()}`);
    console.log(`   Fee APR: ${(feeAPR * 100).toFixed(2)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================================================
    // STEP 8: Return updated state
    // ========================================================================

    return {
      ...state,
      portfolio
    };

  } catch (error) {
    console.error('❌ Data Collection Agent failed:', error);
    throw new Error(`Data Collection Agent error: ${(error as Error).message}`);
  }
}
