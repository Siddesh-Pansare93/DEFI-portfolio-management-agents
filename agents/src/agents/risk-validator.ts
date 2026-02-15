import { WorkflowState, RiskValidation, StrategyProposal, AddLiquidityDetails } from '../types';
import { calculateMaxILInRange, checkPositionLimits } from '../tools/analysis';
import { config } from '../utils/config';

// ============================================================================
// RISK VALIDATOR AGENT
// ============================================================================

/**
 * Risk Validator Agent
 *
 * Purpose: Evaluate proposed strategies for safety and risk compliance
 *
 * Tools Used:
 * - calculateMaxILInRange: Estimate maximum impermanent loss
 * - checkPositionLimits: Verify compliance with risk constraints
 *
 * Risk Limits:
 * - Maximum impermanent loss: 10%
 * - Maximum single position: 70% of portfolio
 * - Minimum diversification: 2 assets
 *
 * Output: Risk validation with approval status and adjusted strategy if needed
 */
export async function runRiskValidator(state: WorkflowState): Promise<WorkflowState> {
  console.log('\n🛡️  ========================================');
  console.log('🛡️  AGENT 4: RISK VALIDATOR AGENT');
  console.log('🛡️  ========================================\n');

  try {
    // Validate required state
    if (!state.portfolio) {
      throw new Error('Portfolio data required for risk validation');
    }
    if (!state.strategyProposal) {
      throw new Error('Strategy proposal required for risk validation');
    }

    const { portfolio, strategyProposal, marketAnalysis } = state;

    console.log('🔍 Validating strategy against risk limits...\n');

    // ========================================================================
    // STEP 1: Extract strategy details
    // ========================================================================

    const violations: string[] = [];
    let estimatedMaxIL = 0;
    let riskScore = 0;

    // ========================================================================
    // STEP 2: Evaluate based on strategy type
    // ========================================================================

    if (strategyProposal.action === 'hold') {
      // HOLD strategy - minimal risk
      riskScore = 0.1; // Very safe

      const riskValidation: RiskValidation = {
        approved: true,
        riskScore,
        estimatedMaxIL,
        violations: [],
        adjustedStrategy: null,
        reasoning: 'Hold strategy carries minimal risk. Current portfolio allocation is maintained with no new exposure.'
      };

      logRiskValidation(riskValidation);

      return {
        ...state,
        riskValidation
      };
    }

    if (strategyProposal.action === 'add_liquidity') {
      const details = strategyProposal.details as AddLiquidityDetails;

      // Check 1: Calculate impermanent loss risk
      const currentEthPrice = portfolio.holdings.ETH.priceUSD;
      estimatedMaxIL = calculateMaxILInRange(
        currentEthPrice,
        details.priceRangeLower,
        details.priceRangeUpper
      );

      console.log(`📊 Impermanent Loss Analysis:`);
      console.log(`   Max IL: ${estimatedMaxIL.toFixed(2)}%`);
      console.log(`   Limit: ${(config.riskLimits.maxImpermanentLoss * 100).toFixed(0)}%\n`);

      if (estimatedMaxIL > config.riskLimits.maxImpermanentLoss * 100) {
        violations.push(
          `Impermanent loss (${estimatedMaxIL.toFixed(2)}%) exceeds maximum limit (${(config.riskLimits.maxImpermanentLoss * 100)}%)`
        );
      }

      // Check 2: Position size limits
      const positionCheck = checkPositionLimits(
        details.ethAmount,
        details.usdcAmount,
        portfolio.holdings.ETH.balance,
        portfolio.holdings.USDC.balance,
        portfolio.holdings.ETH.priceUSD
      );

      if (!positionCheck.valid) {
        violations.push(...positionCheck.violations);
      }

      console.log(`📊 Position Size Check:`);
      console.log(`   ETH Amount: ${details.ethAmount.toFixed(4)} / ${portfolio.holdings.ETH.balance.toFixed(4)}`);
      console.log(`   USDC Amount: ${details.usdcAmount.toFixed(2)} / ${portfolio.holdings.USDC.balance.toFixed(2)}`);
      console.log(`   Valid: ${positionCheck.valid ? '✅' : '❌'}\n`);

      // Check 3: Volatility risk
      const volatility = marketAnalysis?.volatility || 0;
      if (volatility > config.riskLimits.maxVolatilityThreshold * 100) {
        violations.push(
          `Market volatility (${volatility.toFixed(2)}%) exceeds safe threshold (${(config.riskLimits.maxVolatilityThreshold * 100)}%)`
        );
      }

      // Calculate risk score (0 = safest, 1 = riskiest)
      const ilRisk = Math.min(estimatedMaxIL / (config.riskLimits.maxImpermanentLoss * 100), 1);
      const volatilityRisk = Math.min(volatility / 50, 1);
      riskScore = (ilRisk * 0.6) + (volatilityRisk * 0.4); // Weighted average

    } else if (strategyProposal.action === 'swap') {
      // Swap strategy - lower risk than LP
      const details = strategyProposal.details as any;

      // Check if swap amount is reasonable
      const swapValue = details.amount * portfolio.holdings.ETH.priceUSD;
      const swapPercent = swapValue / portfolio.totalValueUSD;

      console.log(`📊 Swap Analysis:`);
      console.log(`   Swap Amount: ${details.amount.toFixed(4)} ${details.fromToken}`);
      console.log(`   Swap Value: $${swapValue.toFixed(2)} (${(swapPercent * 100).toFixed(1)}% of portfolio)\n`);

      if (swapPercent > 0.5) {
        violations.push(`Swap size (${(swapPercent * 100).toFixed(1)}%) exceeds 50% of portfolio`);
      }

      // Swap has lower risk score
      riskScore = 0.2 + (swapPercent * 0.3); // 0.2 to 0.5 range
    }

    // ========================================================================
    // STEP 3: Determine approval status
    // ========================================================================

    const approved = violations.length === 0;

    // ========================================================================
    // STEP 4: Generate adjusted strategy if needed
    // ========================================================================

    let adjustedStrategy: StrategyProposal | null = null;
    let reasoning: string;

    if (!approved) {
      console.log('⚠️  Strategy violates risk limits. Generating safer alternative...\n');

      // Generate safer adjusted strategy
      adjustedStrategy = generateSaferStrategy(strategyProposal);
      reasoning = `Original strategy rejected due to: ${violations.join('; ')}. Adjusted strategy reduces position size and widens price range to comply with risk limits while maintaining yield objectives.`;
    } else {
      reasoning = `Strategy passes all risk checks. Estimated maximum impermanent loss: ${estimatedMaxIL.toFixed(2)}%. Risk score: ${(riskScore * 100).toFixed(0)}/100. Position sizing and market conditions are within acceptable parameters for ${strategyProposal.action.replace('_', ' ')} strategy.`;
    }

    // ========================================================================
    // STEP 5: Construct risk validation object
    // ========================================================================

    const riskValidation: RiskValidation = {
      approved,
      riskScore,
      estimatedMaxIL,
      violations,
      adjustedStrategy,
      reasoning
    };

    // ========================================================================
    // STEP 6: Log results
    // ========================================================================

    logRiskValidation(riskValidation);

    // ========================================================================
    // STEP 7: Return updated state
    // ========================================================================

    return {
      ...state,
      riskValidation
    };

  } catch (error) {
    console.error('❌ Risk Validator Agent failed:', error);
    throw new Error(`Risk Validator Agent error: ${(error as Error).message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a safer version of the strategy
 */
function generateSaferStrategy(
  original: StrategyProposal
): StrategyProposal {
  if (original.action === 'add_liquidity') {
    const details = original.details as AddLiquidityDetails;

    // Reduce position size by 50%
    const saferEthAmount = details.ethAmount * 0.5;
    const saferUsdcAmount = details.usdcAmount * 0.5;

    // Widen price range by 50% to reduce IL
    const currentPrice = (details.priceRangeLower + details.priceRangeUpper) / 2;
    const rangeWidth = details.priceRangeUpper - details.priceRangeLower;
    const widerRangeWidth = rangeWidth * 1.5;

    const saferDetails: AddLiquidityDetails = {
      pool: details.pool,
      ethAmount: saferEthAmount,
      usdcAmount: saferUsdcAmount,
      priceRangeLower: currentPrice - (widerRangeWidth / 2),
      priceRangeUpper: currentPrice + (widerRangeWidth / 2)
    };

    return {
      action: 'add_liquidity',
      details: saferDetails,
      expectedAPY: original.expectedAPY * 0.7, // Lower APY due to smaller position
      expectedReturn1Year: original.expectedReturn1Year * 0.5,
      reasoning: 'Adjusted strategy: Reduced position size by 50% and widened price range by 50% to comply with risk limits.'
    };
  } else if (original.action === 'swap') {
    const details = original.details as any;

    // Reduce swap amount by 50%
    return {
      action: 'swap',
      details: {
        ...details,
        amount: details.amount * 0.5
      },
      expectedAPY: 0,
      expectedReturn1Year: 0,
      reasoning: 'Adjusted strategy: Reduced swap size by 50% to stay within safe position limits.'
    };
  }

  // Default: recommend hold if can't adjust
  return {
    action: 'hold',
    details: null,
    expectedAPY: 0,
    expectedReturn1Year: 0,
    reasoning: 'Original strategy too risky and cannot be safely adjusted. Recommend holding current position.'
  };
}

/**
 * Log risk validation results
 */
function logRiskValidation(validation: RiskValidation): void {
  console.log('✅ RISK VALIDATION COMPLETE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🛡️  Approval: ${validation.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`🛡️  Risk Score: ${(validation.riskScore * 100).toFixed(0)}/100 ${getRiskLevel(validation.riskScore)}`);
  console.log(`🛡️  Max IL: ${validation.estimatedMaxIL.toFixed(2)}%`);

  if (validation.violations.length > 0) {
    console.log(`\n⚠️  Violations:`);
    validation.violations.forEach(v => console.log(`   - ${v}`));
  }

  if (validation.adjustedStrategy) {
    console.log(`\n🔧 Adjusted Strategy: ${validation.adjustedStrategy.action.toUpperCase().replace('_', ' ')}`);
  }

  console.log(`\n💡 Reasoning:`);
  console.log(`   ${validation.reasoning}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Get risk level label
 */
function getRiskLevel(riskScore: number): string {
  if (riskScore < 0.3) return '🟢 LOW';
  if (riskScore < 0.6) return '🟡 MEDIUM';
  return '🔴 HIGH';
}
