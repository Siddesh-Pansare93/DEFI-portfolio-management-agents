// ============================================================================
// TECHNICAL ANALYSIS TOOLS (Pure TypeScript Math)
// ============================================================================

export interface MACDResult {
  value: number;
  signal: number;
  histogram: number;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  percentB: number; // Position within bands (0 = lower, 1 = upper)
}

export interface SupportResistance {
  support: number;
  resistance: number;
}

export type TechnicalSignal = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';

export interface TechnicalAnalysisResult {
  rsi: number;
  macd: MACDResult;
  bollingerBands: BollingerBands;
  ema7: number;
  ema30: number;
  supportResistance: SupportResistance;
  signal: TechnicalSignal;
  priceVsEma7: number;  // % above/below 7-day EMA
  priceVsEma30: number; // % above/below 30-day EMA
}

/**
 * Calculate RSI (Relative Strength Index)
 *
 * @param prices - Array of prices (oldest first)
 * @param period - RSI period (default 14)
 * @returns RSI value (0-100)
 */
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral fallback
  }

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss over first period
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smooth RSI using Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate Exponential Moving Average (EMA)
 *
 * @param prices - Array of prices
 * @param period - EMA period
 * @returns Array of EMA values
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return prices.slice();

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  const initialSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(initialSMA);

  for (let i = period; i < prices.length; i++) {
    const prevEMA = ema[ema.length - 1];
    ema.push((prices[i] - prevEMA) * multiplier + prevEMA);
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence/Divergence)
 *
 * @param prices - Array of prices
 * @returns MACD value, signal line, and histogram
 */
export function calculateMACD(prices: number[]): MACDResult {
  if (prices.length < 26) {
    return { value: 0, signal: 0, histogram: 0 };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  // Align EMA arrays (ema26 starts later)
  const offset = ema12.length - ema26.length;
  const macdLine: number[] = [];

  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }

  // Signal line = 9-day EMA of MACD
  const signalLine = calculateEMA(macdLine, 9);
  const lastMACD = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];

  return {
    value: lastMACD,
    signal: lastSignal,
    histogram: lastMACD - lastSignal
  };
}

/**
 * Calculate Bollinger Bands
 *
 * @param prices - Array of prices
 * @param period - Moving average period (default 20)
 * @param stdDevMultiplier - Standard deviation multiplier (default 2)
 * @returns Upper, middle, lower bands and %B position
 */
export function calculateBollingerBands(
  prices: number[],
  period = 20,
  stdDevMultiplier = 2
): BollingerBands {
  if (prices.length < period) {
    const last = prices[prices.length - 1] || 0;
    return { upper: last * 1.05, middle: last, lower: last * 0.95, percentB: 0.5 };
  }

  const recent = prices.slice(-period);
  const middle = recent.reduce((a, b) => a + b, 0) / period;

  const variance = recent.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDevMultiplier * stdDev;
  const lower = middle - stdDevMultiplier * stdDev;
  const currentPrice = prices[prices.length - 1];

  const percentB = upper !== lower ? (currentPrice - lower) / (upper - lower) : 0.5;

  return { upper, middle, lower, percentB };
}

/**
 * Calculate support and resistance levels
 *
 * @param prices - Array of prices
 * @returns Support and resistance price levels
 */
export function calculateSupportResistance(prices: number[]): SupportResistance {
  if (prices.length === 0) {
    return { support: 0, resistance: 0 };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const len = sorted.length;

  // Support: 20th percentile
  const supportIdx = Math.floor(len * 0.2);
  // Resistance: 80th percentile
  const resistanceIdx = Math.floor(len * 0.8);

  return {
    support: sorted[supportIdx],
    resistance: sorted[resistanceIdx]
  };
}

/**
 * Perform full technical analysis on a price series
 *
 * @param prices - Array of prices (oldest first)
 * @returns Complete technical analysis result
 */
export function performFullTechnicalAnalysis(prices: number[]): TechnicalAnalysisResult {
  if (prices.length < 2) {
    const defaultPrice = prices[0] || 0;
    return {
      rsi: 50,
      macd: { value: 0, signal: 0, histogram: 0 },
      bollingerBands: { upper: defaultPrice * 1.05, middle: defaultPrice, lower: defaultPrice * 0.95, percentB: 0.5 },
      ema7: defaultPrice,
      ema30: defaultPrice,
      supportResistance: { support: defaultPrice * 0.9, resistance: defaultPrice * 1.1 },
      signal: 'hold',
      priceVsEma7: 0,
      priceVsEma30: 0
    };
  }

  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const supportResistance = calculateSupportResistance(prices);

  const ema7Array = calculateEMA(prices, Math.min(7, prices.length));
  const ema30Array = calculateEMA(prices, Math.min(30, prices.length));

  const ema7 = ema7Array[ema7Array.length - 1];
  const ema30 = ema30Array[ema30Array.length - 1];
  const currentPrice = prices[prices.length - 1];

  const priceVsEma7 = ema7 > 0 ? ((currentPrice - ema7) / ema7) * 100 : 0;
  const priceVsEma30 = ema30 > 0 ? ((currentPrice - ema30) / ema30) * 100 : 0;

  // Generate signal
  const signal = generateSignal(rsi, macd, bollingerBands, priceVsEma7, priceVsEma30);

  return {
    rsi,
    macd,
    bollingerBands,
    ema7,
    ema30,
    supportResistance,
    signal,
    priceVsEma7,
    priceVsEma30
  };
}

/**
 * Generate a combined trading signal from multiple indicators
 */
function generateSignal(
  rsi: number,
  macd: MACDResult,
  bb: BollingerBands,
  priceVsEma7: number,
  priceVsEma30: number
): TechnicalSignal {
  let score = 0; // Positive = bullish, negative = bearish

  // RSI signals
  if (rsi < 30) score += 2;       // Oversold → buy
  else if (rsi < 45) score += 1;
  else if (rsi > 70) score -= 2;  // Overbought → sell
  else if (rsi > 60) score -= 1;

  // MACD signals
  if (macd.histogram > 0 && macd.value > 0) score += 1;
  else if (macd.histogram < 0 && macd.value < 0) score -= 1;
  if (macd.histogram > 0 && macd.value < 0) score += 0.5; // Bullish crossover forming
  if (macd.histogram < 0 && macd.value > 0) score -= 0.5; // Bearish crossover forming

  // Bollinger Bands signals
  if (bb.percentB < 0.1) score += 1.5;  // Near lower band → buy
  else if (bb.percentB > 0.9) score -= 1.5; // Near upper band → sell

  // EMA trend signals
  if (priceVsEma7 > 2 && priceVsEma30 > 2) score += 1;   // Both positive → uptrend
  else if (priceVsEma7 < -2 && priceVsEma30 < -2) score -= 1; // Both negative → downtrend

  // Map score to signal
  if (score >= 3) return 'strong_buy';
  if (score >= 1) return 'buy';
  if (score <= -3) return 'strong_sell';
  if (score <= -1) return 'sell';
  return 'hold';
}
