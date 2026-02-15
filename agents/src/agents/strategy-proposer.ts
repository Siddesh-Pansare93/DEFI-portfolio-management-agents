import { WorkflowState, StrategyProposal, AddLiquidityDetails } from '../types';
import { calculateOptimalRange, estimateUniswapAPY } from '../tools/analysis';

// ============================================================================
// STRATEGY PROPOSER AGENT
// ============================================================================

/**
 * Strategy Proposer Agent
 *
 * Purpose: Propose specific portfolio strategies based on portfolio and market data
 *
 * Tools Used:
 * - calculateOptimalRange: Calculate price range for Uniswap V3
 * - estimateUniswapAPY: Estimate yield from liquidity provision
 *
 * Strategy Options:
 * - add_liquidity: Add funds to Uniswap V3 ETH-USDC pool
 * - swap: Exchange tokens to rebalance
 * - hold: Maintain current allocation
 *
 * Output: Detailed strategy proposal with expected returns and reasoning
 */
export async function runStrategyProposer(state: WorkflowState): Promise<WorkflowState> {
  console.log('\n💡 ========================================');
  console.log('💡 AGENT 3: STRATEGY PROPOSER AGENT');
  console.log('💡 ========================================\n');

  try {
    // Validate required state
    if (!state.portfolio) {
      throw new Error('Portfolio data required for strategy proposal');
    }
    if (!state.marketAnalysis) {
      throw new Error('Market analysis required for strategy proposal');
    }

    const { portfolio, marketAnalysis } = state;

    // ========================================================================
    // STEP 1: Analyze current situation
    // ========================================================================

    console.log('🔍 Analyzing portfolio and market conditions...\n');

    const totalValue = portfolio.totalValueUSD;
    const ethAllocation = portfolio.allocationPercent.ETH;

    console.log(`📊 Current Allocation:`);
    console.log(`   ETH: ${ethAllocation.toFixed(1)}%`);
    console.log(`   USDC: ${portfolio.allocationPercent.USDC.toFixed(1)}%\n`);

    console.log(`📈 Market Conditions:`);
    console.log(`   Trend: ${marketAnalysis.ethTrend}`);
    console.log(`   Volatility: ${marketAnalysis.volatility.toFixed(2)}%`);
    console.log(`   Market Recommendation: ${marketAnalysis.recommendation}\n`);

    // ========================================================================
    // STEP 2: Decide on strategy based on conditions
    // ========================================================================

    let strategyProposal: StrategyProposal;

    // Check if portfolio has sufficient funds
    const minPortfolioValue = 100; // Minimum $100 to be worth strategies
    if (totalValue < minPortfolioValue) {
      // HOLD strategy - portfolio too small
      strategyProposal = {
        action: 'hold',
        details: null,
        expectedAPY: 0,
        expectedReturn1Year: 0,
        reasoning: `Portfolio value ($${totalValue.toFixed(2)}) is below minimum threshold ($${minPortfolioValue}). Accumulate more capital before implementing active strategies. Focus on acquiring more ETH or USDC.`
      };
    } else if (marketAnalysis.recommendation === 'increase_eth' && ethAllocation < 70) {
      // ADD LIQUIDITY strategy - bullish market, good for LP
      strategyProposal = await proposeAddLiquidity(state);
    } else if (marketAnalysis.recommendation === 'decrease_eth' && ethAllocation > 30) {
      // SWAP strategy - bearish market, reduce ETH exposure
      strategyProposal = proposeSwapToStable(state);
    } else if (ethAllocation >= 40 && ethAllocation <= 60) {
      // ADD LIQUIDITY - balanced portfolio, good for LP
      strategyProposal = await proposeAddLiquidity(state);
    } else {
      // HOLD strategy - wait for better conditions
      strategyProposal = {
        action: 'hold',
        details: null,
        expectedAPY: 0,
        expectedReturn1Year: 0,
        reasoning: `Current allocation (${ethAllocation.toFixed(1)}% ETH) is ${ethAllocation > 60 ? 'heavily weighted toward ETH' : 'heavily weighted toward USDC'}. Market conditions (${marketAnalysis.ethTrend}, ${marketAnalysis.volatility.toFixed(1)}% volatility) suggest maintaining current position. Consider rebalancing when market stabilizes.`
      };
    }

    // ========================================================================
    // STEP 3: Log strategy proposal
    // ========================================================================

    console.log('\n✅ STRATEGY PROPOSAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Action: ${strategyProposal.action.toUpperCase().replace('_', ' ')}`);

    if (strategyProposal.action === 'add_liquidity' && strategyProposal.details) {
      const details = strategyProposal.details as AddLiquidityDetails;
      console.log(`\n💰 Liquidity Details:`);
      console.log(`   Pool: ${details.pool}`);
      console.log(`   ETH Amount: ${details.ethAmount.toFixed(4)} ETH`);
      console.log(`   USDC Amount: ${details.usdcAmount.toFixed(2)} USDC`);
      console.log(`   Price Range: $${details.priceRangeLower.toFixed(2)} - $${details.priceRangeUpper.toFixed(2)}`);
    } else if (strategyProposal.action === 'swap' && strategyProposal.details) {
      const details = strategyProposal.details as any;
      console.log(`\n💱 Swap Details:`);
      console.log(`   From: ${details.amount.toFixed(4)} ${details.fromToken}`);
      console.log(`   To: ${details.toToken}`);
    }

    console.log(`\n📊 Expected Returns:`);
    console.log(`   APY: ${(strategyProposal.expectedAPY * 100).toFixed(2)}%`);
    console.log(`   1-Year Return: $${strategyProposal.expectedReturn1Year.toFixed(2)}`);

    console.log(`\n💡 Reasoning:`);
    console.log(`   ${strategyProposal.reasoning}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================================================
    // STEP 4: Return updated state
    // ========================================================================

    return {
      ...state,
      strategyProposal
    };

  } catch (error) {
    console.error('❌ Strategy Proposer Agent failed:', error);
    throw new Error(`Strategy Proposer Agent error: ${(error as Error).message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR STRATEGY GENERATION
// ============================================================================

/**
 * Propose adding liquidity to Uniswap V3 pool
 */
async function proposeAddLiquidity(state: WorkflowState): Promise<StrategyProposal> {
  const { portfolio, marketAnalysis } = state;

  if (!portfolio || !marketAnalysis) {
    throw new Error('Portfolio and market analysis required');
  }

  const ethBalance = portfolio.holdings.ETH.balance;
  const usdcBalance = portfolio.holdings.USDC.balance;
  const ethPrice = portfolio.holdings.ETH.priceUSD;
  const totalValue = portfolio.totalValueUSD;

  // Allocate 50% of portfolio to LP position (balanced approach)
  const lpAllocationPercent = 0.5;
  const lpValueUSD = totalValue * lpAllocationPercent;

  // Calculate token amounts for 50/50 split
  const ethValueInLP = lpValueUSD / 2;
  const usdcValueInLP = lpValueUSD / 2;

  const ethAmount = Math.min(ethValueInLP / ethPrice, ethBalance * 0.8); // Max 80% of ETH
  const usdcAmount = Math.min(usdcValueInLP, usdcBalance * 0.8); // Max 80% of USDC

  // Calculate optimal price range based on volatility
  const range = calculateOptimalRange(ethPrice, marketAnalysis.volatility, 1.5);

  // Estimate APY from pool fees
  const poolFeesDaily = portfolio.uniswapPool.feeAPR * portfolio.uniswapPool.liquidity / 365;
  const positionSize = (ethAmount * ethPrice) + usdcAmount;
  const estimatedAPY = estimateUniswapAPY(poolFeesDaily, portfolio.uniswapPool.liquidity, positionSize) / 100;

  const expectedReturn1Year = positionSize * estimatedAPY;

  const details: AddLiquidityDetails = {
    pool: 'ETH-USDC',
    ethAmount,
    usdcAmount,
    priceRangeLower: range.lowerPrice,
    priceRangeUpper: range.upperPrice
  };

  const reasoning = `Based on ${marketAnalysis.ethTrend} market trend and ${marketAnalysis.volatility.toFixed(1)}% volatility, providing liquidity to Uniswap V3 ETH-USDC pool offers attractive yields. The pool currently has $${portfolio.uniswapPool.liquidity.toLocaleString()} in liquidity with ${(portfolio.uniswapPool.feeAPR * 100).toFixed(2)}% fee APR. The proposed position uses ${((positionSize / totalValue) * 100).toFixed(1)}% of your portfolio in a balanced 50/50 ETH-USDC split, with a price range of $${range.lowerPrice.toFixed(2)}-$${range.upperPrice.toFixed(2)} to capture fee earnings while managing volatility risk.`;

  return {
    action: 'add_liquidity',
    details,
    expectedAPY: estimatedAPY,
    expectedReturn1Year,
    reasoning
  };
}

/**
 * Propose swapping ETH to USDC (reduce ETH exposure)
 */
function proposeSwapToStable(state: WorkflowState): StrategyProposal {
  const { portfolio, marketAnalysis } = state;

  if (!portfolio || !marketAnalysis) {
    throw new Error('Portfolio and market analysis required');
  }

  const ethBalance = portfolio.holdings.ETH.balance;
  const ethPrice = portfolio.holdings.ETH.priceUSD;
  const ethAllocation = portfolio.allocationPercent.ETH;

  // Swap to reach 40% ETH allocation (defensive)
  const targetAllocation = 0.4;
  const currentEthValue = ethBalance * ethPrice;
  const targetEthValue = portfolio.totalValueUSD * targetAllocation;
  const swapAmount = Math.min((currentEthValue - targetEthValue) / ethPrice, ethBalance * 0.3); // Max 30% swap

  const details = {
    fromToken: 'ETH',
    toToken: 'USDC',
    amount: swapAmount
  };

  const reasoning = `Market analysis indicates ${marketAnalysis.ethTrend} trend with ${marketAnalysis.volatility.toFixed(1)}% volatility. Current ETH allocation (${ethAllocation.toFixed(1)}%) is high for current market conditions. Swapping ${swapAmount.toFixed(4)} ETH to USDC will reduce exposure to ${targetAllocation * 100}%, providing downside protection while maintaining balanced positioning for future opportunities.`;

  return {
    action: 'swap',
    details,
    expectedAPY: 0,
    expectedReturn1Year: 0,
    reasoning
  };
}
