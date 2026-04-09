import { WorkflowState, FinalRecommendation, StrategyProposal, AddLiquidityDetails } from '../types';

// ============================================================================
// NASH NEGOTIATOR (DETERMINISTIC - NO LLM)
// ============================================================================

/**
 * Nash Bargaining Negotiator
 *
 * Purpose: Combine strategy proposal and risk validation using game theory
 *
 * Algorithm: Nash bargaining solution
 * - Maximizes product of utilities: U_return * U_safety
 * - Deterministic decision rules (no LLM)
 * - Transparent mathematical formula
 *
 * Decision Rules:
 * 1. Both satisfied (high return + high safety) → Accept original strategy
 * 2. Too risky (low safety) → Use risk-adjusted strategy
 * 3. Moderate conflict → Blend strategies with 60/40 safety weighting
 *
 * Output: Final recommendation with confidence score
 */
export function nashNegotiator(state: WorkflowState): WorkflowState {
  console.log('\n🤝 ========================================');
  console.log('🤝 NASH NEGOTIATOR (DETERMINISTIC)');
  console.log('🤝 ========================================\n');

  try {
    // Validate required state
    if (!state.strategyProposal) {
      throw new Error('Strategy proposal required for negotiation');
    }
    if (!state.riskValidation) {
      throw new Error('Risk validation required for negotiation');
    }

    const { strategyProposal, riskValidation } = state;

    // ========================================================================
    // STEP 1: Calculate utilities
    // ========================================================================

    // Return utility: normalized expected APY (0-1)
    const returnUtility = Math.min(strategyProposal.expectedAPY / 0.30, 1); // Cap at 30% APY

    // Safety utility: inverse of risk score (0-1)
    const safetyUtility = 1 - riskValidation.riskScore;

    console.log('📊 Utility Calculations:');
    console.log(`   Return Utility: ${(returnUtility * 100).toFixed(0)}/100`);
    console.log(`   (Expected APY: ${(strategyProposal.expectedAPY * 100).toFixed(2)}%)`);
    console.log(`   Safety Utility: ${(safetyUtility * 100).toFixed(0)}/100`);
    console.log(`   (Risk Score: ${(riskValidation.riskScore * 100).toFixed(0)}/100)\n`);

    // ========================================================================
    // STEP 2: Apply Nash bargaining decision rules
    // ========================================================================

    let finalRecommendation: FinalRecommendation;
    let decisionReason: string;

    // RULE 1: Both agents satisfied (high return AND high safety)
    if (riskValidation.approved && returnUtility > 0.10 && safetyUtility > 0.6) {
      console.log('✅ Decision: ACCEPT ORIGINAL STRATEGY');
      console.log('   Reason: Both return and safety utilities are high\n');

      finalRecommendation = {
        action: strategyProposal.action,
        details: strategyProposal.details,
        expectedAPY: strategyProposal.expectedAPY,
        maxRisk: riskValidation.estimatedMaxIL,
        confidence: returnUtility * safetyUtility, // Nash product
        explanation: combineReasoningBothApproved(strategyProposal, riskValidation)
      };

      decisionReason = 'Original strategy accepted - optimal balance of returns and safety';
    }
    // RULE 2: Too risky (low safety utility or not approved)
    else if (!riskValidation.approved || safetyUtility < 0.4) {
      console.log('⚠️  Decision: USE RISK-ADJUSTED STRATEGY');
      console.log('   Reason: Safety concerns require adjustment\n');

      if (riskValidation.adjustedStrategy) {
        // For risk-adjusted strategies, confidence reflects that we adapted to be safer
        // Floor at 0.55 — the adjusted strategy IS the safe choice
        const adjustedConfidence = Math.max(0.55, 0.3 + safetyUtility * 0.5 + returnUtility * 0.3);
        finalRecommendation = {
          action: riskValidation.adjustedStrategy.action,
          details: riskValidation.adjustedStrategy.details,
          expectedAPY: riskValidation.adjustedStrategy.expectedAPY,
          maxRisk: riskValidation.estimatedMaxIL * 0.7, // Adjusted strategy has lower risk
          confidence: Math.min(adjustedConfidence, 0.85),
          explanation: combineReasoningRiskAdjusted(riskValidation)
        };

        decisionReason = 'Risk-adjusted strategy adopted for safety';
      } else {
        // No adjusted strategy - default to hold (still a deliberate decision)
        finalRecommendation = {
          action: 'hold',
          details: null,
          expectedAPY: 0,
          maxRisk: 0,
          confidence: 0.65,
          explanation: `Strategy rejected due to risk concerns. ${riskValidation.reasoning} Maintaining current portfolio allocation is the safest option.`
        };

        decisionReason = 'Hold strategy - original too risky, no safe adjustment available';
      }
    }
    // RULE 3: Moderate conflict - blend strategies
    else {
      console.log('🔄 Decision: BLEND STRATEGIES');
      console.log('   Reason: Moderate return/risk trade-off\n');

      finalRecommendation = blendStrategies(
        strategyProposal,
        riskValidation.adjustedStrategy,
        safetyUtility
      );

      decisionReason = 'Blended strategy - balanced compromise between return and safety';
    }

    // ========================================================================
    // STEP 3: Log final decision
    // ========================================================================

    console.log('✅ FINAL RECOMMENDATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Action: ${finalRecommendation.action.toUpperCase().replace('_', ' ')}`);
    console.log(`📊 Expected APY: ${(finalRecommendation.expectedAPY * 100).toFixed(2)}%`);
    console.log(`🛡️  Max Risk (IL): ${finalRecommendation.maxRisk.toFixed(2)}%`);
    console.log(`💯 Confidence: ${(finalRecommendation.confidence * 100).toFixed(0)}%`);
    console.log(`\n🤝 Negotiation Outcome: ${decisionReason}`);

    if (finalRecommendation.action === 'add_liquidity' && finalRecommendation.details) {
      const details = finalRecommendation.details as AddLiquidityDetails;
      console.log(`\n💰 Position Details:`);
      console.log(`   ${details.ethAmount.toFixed(4)} ETH + ${details.usdcAmount.toFixed(2)} USDC`);
      console.log(`   Range: $${details.priceRangeLower.toFixed(2)} - $${details.priceRangeUpper.toFixed(2)}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================================================
    // STEP 4: Return updated state with final recommendation
    // ========================================================================

    return {
      ...state,
      finalRecommendation
    };

  } catch (error) {
    console.error('❌ Nash Negotiator failed:', error);
    throw new Error(`Nash Negotiator error: ${(error as Error).message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Combine reasoning when both agents approve
 */
function combineReasoningBothApproved(
  strategy: StrategyProposal,
  risk: any
): string {
  return `${strategy.reasoning}\n\nRisk Assessment: ${risk.reasoning}\n\nThis strategy offers an optimal balance between yield generation and risk management, making it suitable for execution.`;
}

/**
 * Combine reasoning when using risk-adjusted strategy
 */
function combineReasoningRiskAdjusted(risk: any): string {
  return `Risk-Adjusted Strategy: ${risk.reasoning}\n\nThe adjusted strategy provides a safer alternative that maintains yield objectives while staying within acceptable risk parameters.`;
}

/**
 * Blend two strategies with weighted average
 * Used when there's moderate conflict between return and safety
 */
function blendStrategies(
  strategy1: StrategyProposal,
  strategy2: StrategyProposal | null,
  safetyWeight: number
): FinalRecommendation {
  // If no adjusted strategy, prefer safety (hold or reduce original)
  if (!strategy2) {
    return {
      action: strategy1.action,
      details: reduceStrategySize(strategy1.details, 0.7), // Reduce to 70%
      expectedAPY: strategy1.expectedAPY * 0.7,
      maxRisk: strategy1.expectedAPY > 0 ? 8 : 0, // Conservative IL estimate
      confidence: 0.6,
      explanation: `Modified strategy with reduced position size for balanced risk-return profile. ${strategy1.reasoning}`
    };
  }

  // Blend two strategies - favor the safer one
  const returnWeight = 1 - safetyWeight;

  // Weighted average of APY
  const blendedAPY = (strategy1.expectedAPY * returnWeight) + (strategy2.expectedAPY * safetyWeight);

  // Use safer strategy's details but with blended sizing
  const baseStrategy = safetyWeight > 0.5 ? strategy2 : strategy1;

  return {
    action: baseStrategy.action,
    details: baseStrategy.details,
    expectedAPY: blendedAPY,
    maxRisk: Math.max(5, Math.min(10, blendedAPY * 50)), // Heuristic: higher APY = higher risk
    confidence: 0.7,
    explanation: `Blended recommendation balancing ${(returnWeight * 100).toFixed(0)}% return optimization and ${(safetyWeight * 100).toFixed(0)}% risk management. ${baseStrategy.reasoning}`
  };
}

/**
 * Reduce strategy position size by a factor
 */
function reduceStrategySize(details: any, factor: number): any {
  if (!details) return null;

  if ('ethAmount' in details && 'usdcAmount' in details) {
    // Add liquidity details — reduce size and ensure valid price range
    const result = {
      ...details,
      ethAmount: details.ethAmount * factor,
      usdcAmount: details.usdcAmount * factor
    };
    // Ensure price range is never negative
    if (result.priceRangeLower !== undefined && result.priceRangeLower <= 0) {
      result.priceRangeLower = (details.priceRangeUpper || 3000) * 0.1;
    }
    return result;
  } else if ('amount' in details) {
    // Swap details
    return {
      ...details,
      amount: details.amount * factor
    };
  }

  return details;
}
