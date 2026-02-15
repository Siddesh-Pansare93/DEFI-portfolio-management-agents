import { PricePoint, OptimalRangeResult } from '../types';
import { config, getTickSpacing } from '../utils/config';

// ============================================================================
// VOLATILITY CALCULATIONS
// ============================================================================

/**
 * Calculate annualized volatility from price history
 *
 * @param prices - Array of price points
 * @returns Volatility as percentage (0-100)
 *
 * @example
 * const history = await getPriceHistory('ethereum', 30);
 * const volatility = calculateVolatility(history);
 * console.log(`30-day volatility: ${volatility.toFixed(2)}%`);
 */
export function calculateVolatility(prices: PricePoint[]): number {
  if (prices.length < 2) {
    throw new Error('Need at least 2 price points to calculate volatility');
  }

  const priceValues = prices.map(p => p.price);

  // Calculate mean price
  const mean = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;

  // Calculate variance (average of squared differences from mean)
  const squaredDiffs = priceValues.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / priceValues.length;

  // Standard deviation
  const stdDev = Math.sqrt(variance);

  // Annualized volatility: (stdDev / mean) * sqrt(365) * 100
  const annualizedVol = (stdDev / mean) * Math.sqrt(365) * 100;

  return annualizedVol;
}

/**
 * Calculate daily returns from price points
 * Returns are expressed as percentages
 *
 * @param prices - Array of price points
 * @returns Array of daily returns
 */
export function calculateDailyReturns(prices: PricePoint[]): number[] {
  if (prices.length < 2) {
    return [];
  }

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = ((prices[i].price - prices[i - 1].price) / prices[i - 1].price) * 100;
    returns.push(dailyReturn);
  }

  return returns;
}

// ============================================================================
// UNISWAP V3 RANGE CALCULATIONS
// ============================================================================

/**
 * Calculate optimal price range for Uniswap V3 position
 *
 * @param currentPrice - Current token price
 * @param volatility - Annualized volatility percentage
 * @param rangeMultiplier - How tight the range (default 1.5)
 * @returns Price range with lower and upper bounds plus ticks
 *
 * @example
 * const range = calculateOptimalRange(2000, 35, 1.5);
 * console.log(`Range: $${range.lowerPrice} - $${range.upperPrice}`);
 */
export function calculateOptimalRange(
  currentPrice: number,
  volatility: number,
  rangeMultiplier: number = 1.5
): OptimalRangeResult {
  // Calculate range width based on volatility
  // Higher volatility = wider range to avoid going out of range
  const rangePercent = (volatility / 100) * rangeMultiplier;

  const lowerPrice = currentPrice * (1 - rangePercent);
  const upperPrice = currentPrice * (1 + rangePercent);

  // Convert prices to Uniswap V3 ticks
  // Tick = log base 1.0001 of price
  const lowerTick = Math.floor(Math.log(lowerPrice) / Math.log(1.0001));
  const upperTick = Math.floor(Math.log(upperPrice) / Math.log(1.0001));

  // Round to nearest tick spacing for 0.3% fee tier (spacing = 60)
  const tickSpacing = getTickSpacing(config.uniswapV3.feeTiers.LOW);
  const roundedLowerTick = Math.floor(lowerTick / tickSpacing) * tickSpacing;
  const roundedUpperTick = Math.ceil(upperTick / tickSpacing) * tickSpacing;

  return {
    lowerPrice,
    upperPrice,
    lowerTick: roundedLowerTick,
    upperTick: roundedUpperTick
  };
}

/**
 * Calculate price from Uniswap V3 tick
 *
 * @param tick - Uniswap V3 tick
 * @returns Price
 */
export function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}

/**
 * Calculate tick from price
 *
 * @param price - Token price
 * @returns Tick
 */
export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

// ============================================================================
// APY CALCULATIONS
// ============================================================================

/**
 * Estimate APY from providing liquidity to Uniswap pool
 *
 * @param poolFeesDaily - Daily fees collected by pool (USD)
 * @param poolLiquidity - Total value locked in pool (USD)
 * @param positionSize - Size of position to provide (USD)
 * @returns Estimated APY as percentage (0-100)
 *
 * @example
 * const apy = estimateUniswapAPY(5000, 1000000, 10000);
 * console.log(`Estimated APY: ${apy.toFixed(2)}%`);
 */
export function estimateUniswapAPY(
  poolFeesDaily: number,
  poolLiquidity: number,
  positionSize: number
): number {
  if (poolLiquidity === 0) {
    return 0;
  }

  // User's share of fees = (positionSize / poolLiquidity) * poolFeesDaily
  const dailyEarnings = (positionSize / poolLiquidity) * poolFeesDaily;

  // Annualize (multiply by 365)
  const annualEarnings = dailyEarnings * 365;

  // APY = (annual earnings / position size) * 100
  const apy = (annualEarnings / positionSize) * 100;

  return apy;
}

/**
 * Calculate compound APY (assumes reinvestment of earnings)
 *
 * @param baseAPY - Base APY as decimal (e.g., 0.15 for 15%)
 * @param compoundingPeriods - Number of times per year to compound
 * @returns Compound APY as percentage
 */
export function calculateCompoundAPY(
  baseAPY: number,
  compoundingPeriods: number = 365
): number {
  // Compound interest formula: (1 + r/n)^n - 1
  const compoundAPY = Math.pow(1 + baseAPY / compoundingPeriods, compoundingPeriods) - 1;
  return compoundAPY * 100;
}

// ============================================================================
// IMPERMANENT LOSS CALCULATIONS
// ============================================================================

/**
 * Calculate potential impermanent loss for a position
 *
 * @param priceChange - Ratio of new price to original (e.g., 2 = price doubled, 0.5 = price halved)
 * @returns IL as percentage (always positive, e.g., 5.72 for 5.72% loss)
 *
 * @example
 * const il = calculateImpermanentLoss(2); // Price doubled
 * console.log(`IL if price doubles: ${il.toFixed(2)}%`);
 */
export function calculateImpermanentLoss(priceChange: number): number {
  if (priceChange <= 0) {
    throw new Error('Price change must be positive');
  }

  // IL formula for 50/50 pools:
  // IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  const il = 2 * Math.sqrt(priceChange) / (1 + priceChange) - 1;

  // Return as positive percentage
  return Math.abs(il) * 100;
}

/**
 * Calculate maximum IL based on price range
 *
 * @param currentPrice - Current price
 * @param lowerPrice - Lower bound of range
 * @param upperPrice - Upper bound of range
 * @returns Maximum IL percentage
 */
export function calculateMaxILInRange(
  currentPrice: number,
  lowerPrice: number,
  upperPrice: number
): number {
  // Max IL occurs at range boundaries
  const ilAtLower = calculateImpermanentLoss(lowerPrice / currentPrice);
  const ilAtUpper = calculateImpermanentLoss(upperPrice / currentPrice);

  return Math.max(ilAtLower, ilAtUpper);
}

// ============================================================================
// POSITION LIMIT CHECKS
// ============================================================================

/**
 * Check if a proposed position violates risk limits
 *
 * @param ethAmount - Amount of ETH to allocate
 * @param usdcAmount - Amount of USDC to allocate
 * @param currentEthBalance - Current ETH holdings
 * @param currentUsdcBalance - Current USDC holdings
 * @param ethPrice - Current ETH price in USD
 * @returns Validation result with violations list
 *
 * @example
 * const check = checkPositionLimits(0.5, 1000, 1.0, 2000, 2000);
 * if (!check.valid) {
 *   console.log('Violations:', check.violations);
 * }
 */
export function checkPositionLimits(
  ethAmount: number,
  usdcAmount: number,
  currentEthBalance: number,
  currentUsdcBalance: number,
  ethPrice: number
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check if amounts exceed current balances
  if (ethAmount > currentEthBalance) {
    violations.push(
      `Insufficient ETH: Need ${ethAmount.toFixed(4)}, have ${currentEthBalance.toFixed(4)}`
    );
  }

  if (usdcAmount > currentUsdcBalance) {
    violations.push(
      `Insufficient USDC: Need ${usdcAmount.toFixed(2)}, have ${currentUsdcBalance.toFixed(2)}`
    );
  }

  // Calculate position size as % of total portfolio
  const totalPortfolioValue = (currentEthBalance * ethPrice) + currentUsdcBalance;
  const positionValue = (ethAmount * ethPrice) + usdcAmount;
  const positionPercent = positionValue / totalPortfolioValue;

  // Check max single position limit (70%)
  if (positionPercent > config.riskLimits.maxSinglePosition) {
    violations.push(
      `Position too large: ${(positionPercent * 100).toFixed(1)}% exceeds ${(config.riskLimits.maxSinglePosition * 100)}% limit`
    );
  }

  // Check minimum allocation (at least some funds should remain)
  const remainingValue = totalPortfolioValue - positionValue;
  if (remainingValue < 0) {
    violations.push('Position exceeds total portfolio value');
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Calculate portfolio diversification score
 * 1.0 = perfectly diversified, 0.0 = concentrated in one asset
 *
 * @param allocations - Array of allocation percentages (0-1)
 * @returns Diversification score (0-1)
 */
export function calculateDiversificationScore(allocations: number[]): number {
  if (allocations.length === 0) {
    return 0;
  }

  // Herfindahl-Hirschman Index (HHI) - lower is more diversified
  const hhi = allocations.reduce((sum, alloc) => sum + Math.pow(alloc, 2), 0);

  // Convert to diversification score (invert and normalize)
  // Perfect diversification (equal allocation) = 1/n
  // Single asset = 1
  const maxHHI = 1; // All in one asset
  const minHHI = 1 / allocations.length; // Perfectly diversified

  const diversificationScore = 1 - ((hhi - minHHI) / (maxHHI - minHHI));

  return Math.max(0, Math.min(1, diversificationScore));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate Sharpe ratio (risk-adjusted return)
 *
 * @param returns - Array of period returns (e.g., daily returns)
 * @param riskFreeRate - Annual risk-free rate (default 0.02 = 2%)
 * @returns Sharpe ratio
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.02
): number {
  if (returns.length === 0) {
    return 0;
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );

  if (stdDev === 0) {
    return 0;
  }

  // Annualize if using daily returns
  const annualizedReturn = avgReturn * 365;
  const annualizedStdDev = stdDev * Math.sqrt(365);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

/**
 * Calculate Value at Risk (VaR)
 * Estimates maximum loss at a given confidence level
 *
 * @param returns - Array of returns
 * @param confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 * @returns VaR as percentage
 */
export function calculateVaR(returns: number[], confidenceLevel: number = 0.95): number {
  if (returns.length === 0) {
    return 0;
  }

  // Sort returns in ascending order
  const sortedReturns = [...returns].sort((a, b) => a - b);

  // Find the return at the specified percentile
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);

  return Math.abs(sortedReturns[index]);
}
