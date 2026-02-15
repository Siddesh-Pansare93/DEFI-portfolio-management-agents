import { config } from '../utils/config';
import { WorkflowState, PortfolioData } from '../types';
import { getEthBalance, getErc20Balance } from '../tools/balance-reader';
import { getTokenPrice } from '../tools/price-fetcher';
import { getUniswapPoolData } from '../tools/pool-data';

// ============================================================================
// DATA COLLECTION AGENT
// ============================================================================

/**
 * Data Collection Agent
 *
 * Purpose: Gather all current factual data about the user's portfolio
 *
 * Tools Used:
 * - getEthBalance: Fetch ETH balance from blockchain
 * - getErc20Balance: Fetch USDC balance from blockchain
 * - getTokenPrice: Get current USD prices from CoinGecko
 * - getUniswapPoolData: Get pool statistics from The Graph
 *
 * Output: Complete portfolio snapshot with balances, prices, and pool data
 */
export async function runDataCollector(state: WorkflowState): Promise<WorkflowState> {
  console.log('\n📊 ========================================');
  console.log('📊 AGENT 1: DATA COLLECTION AGENT');
  console.log('📊 ========================================\n');

  try {
    const { walletAddress } = state;

    // ========================================================================
    // STEP 1: Fetch all data using tools directly
    // ========================================================================

    console.log('🔍 Fetching portfolio data...\n');

    // Fetch balances in parallel
    const [ethBalance, usdcBalance] = await Promise.all([
      getEthBalance(walletAddress),
      getErc20Balance(walletAddress, config.usdcAddress)
    ]);

    // Fetch prices in parallel
    const [ethPrice, usdcPrice] = await Promise.all([
      getTokenPrice(config.tokenSymbols.ETH),
      getTokenPrice(config.tokenSymbols.USDC)
    ]);

    // Fetch pool data
    const poolData = await getUniswapPoolData(config.uniswapPoolAddress);

    // ========================================================================
    // STEP 2: Calculate portfolio metrics
    // ========================================================================

    const ethValueUSD = ethBalance * ethPrice;
    const usdcValueUSD = usdcBalance * usdcPrice;
    const totalValueUSD = ethValueUSD + usdcValueUSD;

    // Calculate allocation percentages
    const ethAllocationPercent = totalValueUSD > 0 ? (ethValueUSD / totalValueUSD) * 100 : 0;
    const usdcAllocationPercent = totalValueUSD > 0 ? (usdcValueUSD / totalValueUSD) * 100 : 0;

    // ========================================================================
    // STEP 3: Construct portfolio data object
    // ========================================================================

    const portfolio: PortfolioData = {
      holdings: {
        ETH: {
          balance: ethBalance,
          priceUSD: ethPrice,
          valueUSD: ethValueUSD
        },
        USDC: {
          balance: usdcBalance,
          priceUSD: usdcPrice,
          valueUSD: usdcValueUSD
        }
      },
      totalValueUSD,
      allocationPercent: {
        ETH: ethAllocationPercent,
        USDC: usdcAllocationPercent
      },
      uniswapPool: {
        address: config.uniswapPoolAddress,
        liquidity: poolData.liquidity,
        volume24h: poolData.volumeUSD,
        feeAPR: (poolData.feesUSD / poolData.liquidity) * 365 // Calculate APR
      }
    };

    // ========================================================================
    // STEP 4: Log results
    // ========================================================================

    console.log('\n✅ PORTFOLIO DATA COLLECTED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💰 Total Portfolio Value: $${totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log('\n📊 Holdings:');
    console.log(`   ETH:  ${ethBalance.toFixed(4)} ETH @ $${ethPrice.toFixed(2)} = $${ethValueUSD.toFixed(2)} (${ethAllocationPercent.toFixed(1)}%)`);
    console.log(`   USDC: ${usdcBalance.toFixed(2)} USDC @ $${usdcPrice.toFixed(2)} = $${usdcValueUSD.toFixed(2)} (${usdcAllocationPercent.toFixed(1)}%)`);
    console.log('\n🏊 Uniswap ETH-USDC Pool:');
    console.log(`   TVL: $${poolData.liquidity.toLocaleString()}`);
    console.log(`   24h Volume: $${poolData.volumeUSD.toLocaleString()}`);
    console.log(`   Fee APR: ${(portfolio.uniswapPool.feeAPR * 100).toFixed(2)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================================================
    // STEP 5: Return updated state
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
