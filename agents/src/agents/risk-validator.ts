import { WorkflowState, RiskValidation, StrategyProposal, AddLiquidityDetails, NegotiationMessage, UserPreferences } from '../types';
import { calculateMaxILInRange, checkPositionLimits } from '../tools/analysis';
import { config } from '../utils/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// ============================================================================
// RISK VALIDATOR AGENT (Gemini LLM + Round-Aware Critique)
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  maxImpermanentLoss: 10,
  maxPositionSize: 70,
  riskAppetite: 'moderate',
  preferredActions: ['add_liquidity', 'swap', 'hold']
};

/**
 * Risk Validator Agent
 *
 * Purpose: Validate strategies with round-aware critique using Gemini LLM
 * - Round 1-3: Strict application of all limits
 * - Round 4-6: Begins showing flexibility on edge cases
 * - Round 7-9: "I can accept X if you change Y" language
 * - Round 10: Forced decision — approve or state single unresolvable concern
 */
export async function runRiskValidator(state: WorkflowState): Promise<WorkflowState> {
  const round = state.negotiationRound || 1;

  console.log('\n🛡️  ========================================');
  console.log(`🛡️  AGENT 4: RISK VALIDATOR (Round ${round})`);
  console.log('🛡️  ========================================\n');

  try {
    if (!state.portfolio) throw new Error('Portfolio data required for risk validation');
    if (!state.strategyProposal) throw new Error('Strategy proposal required for risk validation');

    const { portfolio, strategyProposal, marketAnalysis } = state;
    const prefs = state.userPreferences || DEFAULT_PREFERENCES;

    // ========================================================================
    // STEP 1: Run deterministic risk checks (always runs, safety net)
    // ========================================================================

    const { violations, estimatedMaxIL, riskScore } = runDeterministicChecks(
      strategyProposal, portfolio, marketAnalysis, prefs
    );
    const deterministicApproved = violations.length === 0;
    const adjustedStrategy = deterministicApproved ? null : generateSaferStrategy(strategyProposal);

    // ========================================================================
    // STEP 2: Try Gemini for reasoning and round-aware critique
    // ========================================================================

    let geminiContent = '';
    let geminiKeyPoints: string[] = [];
    let finalApproved = deterministicApproved;

    try {
      const geminiResult = await validateWithGemini(
        state, prefs, round, violations, estimatedMaxIL, riskScore
      );
      geminiContent = geminiResult.content;
      geminiKeyPoints = geminiResult.keyPoints;

      // Round 10: Gemini can override deterministic rejection with "approve with conditions"
      if (round >= 10 && !deterministicApproved && violations.length > 0) {
        const isCatastrophic = violations.some(v =>
          v.includes('Insufficient') || v.includes('exceeds total portfolio')
        );
        if (!isCatastrophic) {
          finalApproved = true; // Force approval on round 10 if not catastrophic
          console.log('🔄 Round 10: Forcing approval (no catastrophic violations)\n');
        }
      }

      console.log(`✅ Gemini critique complete (Round ${round})\n`);
    } catch (err) {
      console.warn('⚠️  Gemini critique failed, using deterministic:', (err as Error).message);
      geminiContent = generateDeterministicCritique(violations, estimatedMaxIL, round, prefs);
      geminiKeyPoints = violations.length > 0 ? violations.slice(0, 3) : ['Strategy passed all risk checks'];
    }

    // ========================================================================
    // STEP 3: Build risk validation
    // ========================================================================

    const riskValidation: RiskValidation = {
      approved: finalApproved,
      riskScore,
      estimatedMaxIL,
      violations,
      adjustedStrategy: finalApproved ? null : adjustedStrategy,
      reasoning: geminiContent,
      geminiReasoning: geminiContent,
      round
    };

    // ========================================================================
    // STEP 4: Log negotiation message
    // ========================================================================

    const msgType = finalApproved ? 'agreement'
      : round <= 3 ? 'critique'
      : round <= 6 ? 'counter_proposal'
      : round <= 9 ? 'concession'
      : 'final_decision';

    const negotiationMessage: NegotiationMessage = {
      round,
      from: 'RiskValidator',
      type: msgType,
      content: geminiContent,
      proposalRef: `v${round}`,
      keyPoints: geminiKeyPoints,
      timestamp: new Date()
    };

    // ========================================================================
    // STEP 5: Log results
    // ========================================================================

    logRiskValidation(riskValidation, round);

    // ========================================================================
    // STEP 6: Return updated state
    // ========================================================================

    const allMessages = [...(state.negotiationMessages || []), negotiationMessage];

    return {
      ...state,
      riskValidation,
      negotiationMessages: allMessages
    };

  } catch (error) {
    console.error('❌ Risk Validator Agent failed:', error);
    throw new Error(`Risk Validator Agent error: ${(error as Error).message}`);
  }
}

// ============================================================================
// GEMINI VALIDATION
// ============================================================================

async function validateWithGemini(
  state: WorkflowState,
  prefs: UserPreferences,
  round: number,
  violations: string[],
  estimatedMaxIL: number,
  riskScore: number
): Promise<{ content: string; keyPoints: string[] }> {
  const llm = new ChatGoogleGenerativeAI({
    model: config.geminiModel,
    apiKey: config.googleApiKey,
    temperature: 0.3,
  });

  const { strategyProposal, portfolio } = state;
  if (!strategyProposal || !portfolio) throw new Error('Missing state');

  const roundTone = round <= 3
    ? `Apply risk limits rigorously. Be specific about violations with exact numbers.`
    : round <= 6
    ? `You've rejected ${round - 1} proposals. Start showing flexibility. Be open to accepting slightly higher risk if returns justify it. State what EXACTLY would make you approve.`
    : round <= 9
    ? `Near round ${round}. Use "I can accept X if you change Y" language. Show genuine willingness to compromise.`
    : `Round ${round} (FINAL). You MUST decide. Either approve with conditions, or state the SINGLE most important unresolvable concern. Reject only if truly catastrophic (exceeds balances or doubles the IL limit).`;

  const systemPrompt = `You are a DeFi risk manager. ${roundTone}

Be direct and actionable. If rejecting, provide SPECIFIC fixes (e.g., "Narrow range from [2200-3000] to [2500-2800] to reduce IL from 9.8% to 5.2%").`;

  const stratDetails = strategyProposal.action === 'add_liquidity' && strategyProposal.details
    ? strategyProposal.details as AddLiquidityDetails
    : null;

  const userPrompt = `Round ${round} Risk Assessment

PROPOSAL (v${round}):
- Action: ${strategyProposal.action}
${stratDetails ? `- ETH: ${stratDetails.ethAmount.toFixed(4)}, USDC: $${stratDetails.usdcAmount.toFixed(2)}
- Price range: $${stratDetails.priceRangeLower.toFixed(2)} - $${stratDetails.priceRangeUpper.toFixed(2)}` : ''}
- Expected APY: ${(strategyProposal.expectedAPY * 100).toFixed(2)}%

CALCULATED RISKS:
- Estimated max IL: ${estimatedMaxIL.toFixed(2)}% (limit: ${prefs.maxImpermanentLoss}%)
- Risk score: ${(riskScore * 100).toFixed(0)}/100
- ETH price: $${portfolio.holdings['ETH']?.priceUSD?.toFixed(2) || 'N/A'}

VIOLATIONS FOUND:
${violations.length > 0 ? violations.map(v => `- ${v}`).join('\n') : '- None (deterministic checks passed)'}

USER PREFERENCES:
- Max IL: ${prefs.maxImpermanentLoss}% | Max Position: ${prefs.maxPositionSize}%
- Risk Appetite: ${prefs.riskAppetite}

Provide your assessment in 2-3 paragraphs. End with either:
APPROVED: <brief approval statement>
OR
REJECTED: <most critical concern> | SUGGESTION: <specific fix with numbers>

Also provide KEY_POINTS as a JSON array at the end:
KEY_POINTS: ["point 1", "point 2", "point 3"]`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ]);

  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  // Extract key points from response
  const keyPointsMatch = content.match(/KEY_POINTS:\s*(\[[\s\S]*?\])/);
  let keyPoints: string[] = [];
  if (keyPointsMatch) {
    try {
      keyPoints = JSON.parse(keyPointsMatch[1]);
    } catch {
      keyPoints = violations.length > 0 ? violations.slice(0, 3) : ['Assessment complete'];
    }
  } else {
    keyPoints = violations.length > 0 ? violations.slice(0, 3) : ['All risk checks passed'];
  }

  // Strip KEY_POINTS from main content
  const cleanContent = content.replace(/KEY_POINTS:[\s\S]*$/, '').trim();

  return { content: cleanContent, keyPoints };
}

// ============================================================================
// DETERMINISTIC CHECKS (ALWAYS RUNS)
// ============================================================================

function runDeterministicChecks(
  strategyProposal: StrategyProposal,
  portfolio: any,
  marketAnalysis: any,
  prefs: UserPreferences
): { violations: string[]; estimatedMaxIL: number; riskScore: number } {
  const violations: string[] = [];
  let estimatedMaxIL = 0;
  let riskScore = 0;

  if (strategyProposal.action === 'hold') {
    return { violations: [], estimatedMaxIL: 0, riskScore: 0.1 };
  }

  if (strategyProposal.action === 'add_liquidity') {
    const details = strategyProposal.details as AddLiquidityDetails;
    if (!details) return { violations: ['Missing liquidity details'], estimatedMaxIL: 0, riskScore: 0.5 };

    const ethPrice = portfolio.holdings['ETH']?.priceUSD || 2000;

    estimatedMaxIL = calculateMaxILInRange(ethPrice, details.priceRangeLower, details.priceRangeUpper);

    if (estimatedMaxIL > prefs.maxImpermanentLoss) {
      violations.push(`Impermanent loss (${estimatedMaxIL.toFixed(2)}%) exceeds user limit (${prefs.maxImpermanentLoss}%)`);
    }

    const ethBalance = portfolio.holdings['ETH']?.balance || 0;
    const usdcBalance = portfolio.holdings['USDC']?.balance || 0;

    const positionCheck = checkPositionLimits(
      details.ethAmount, details.usdcAmount,
      ethBalance, usdcBalance, ethPrice
    );
    if (!positionCheck.valid) {
      violations.push(...positionCheck.violations);
    }

    // Check position size against user preference
    const positionValue = (details.ethAmount * ethPrice) + details.usdcAmount;
    const positionPercent = portfolio.totalValueUSD > 0
      ? (positionValue / portfolio.totalValueUSD) * 100
      : 0;
    if (positionPercent > prefs.maxPositionSize) {
      violations.push(`Position size (${positionPercent.toFixed(1)}%) exceeds user limit (${prefs.maxPositionSize}%)`);
    }

    const volatility = marketAnalysis?.volatility || 0;
    if (volatility > config.riskLimits.maxVolatilityThreshold * 100) {
      violations.push(`Market volatility (${volatility.toFixed(1)}%) exceeds threshold (${config.riskLimits.maxVolatilityThreshold * 100}%)`);
    }

    const ilRisk = Math.min(estimatedMaxIL / prefs.maxImpermanentLoss, 1);
    const volRisk = Math.min(volatility / 50, 1);
    riskScore = ilRisk * 0.6 + volRisk * 0.4;

  } else if (strategyProposal.action === 'swap') {
    const details = strategyProposal.details as any;
    if (details?.amount) {
      const swapValue = details.amount * (portfolio.holdings['ETH']?.priceUSD || 2000);
      const swapPercent = portfolio.totalValueUSD > 0 ? (swapValue / portfolio.totalValueUSD) * 100 : 0;
      if (swapPercent > 50) {
        violations.push(`Swap size (${swapPercent.toFixed(1)}%) exceeds 50% of portfolio`);
      }
      riskScore = 0.2 + (swapPercent / 100) * 0.3;
    }
  }

  return { violations, estimatedMaxIL, riskScore };
}

function generateSaferStrategy(original: StrategyProposal): StrategyProposal {
  if (original.action === 'add_liquidity' && original.details) {
    const d = original.details as AddLiquidityDetails;
    const center = (d.priceRangeLower + d.priceRangeUpper) / 2;
    const width = (d.priceRangeUpper - d.priceRangeLower) * 1.5;

    return {
      ...original,
      details: {
        ...d,
        ethAmount: d.ethAmount * 0.5,
        usdcAmount: d.usdcAmount * 0.5,
        priceRangeLower: center - width / 2,
        priceRangeUpper: center + width / 2
      },
      expectedAPY: original.expectedAPY * 0.7,
      expectedReturn1Year: original.expectedReturn1Year * 0.5,
      reasoning: 'Adjusted: 50% smaller position, 50% wider range.'
    };
  }
  if (original.action === 'swap') {
    const d = original.details as any;
    return { ...original, details: { ...d, amount: d.amount * 0.5 }, reasoning: 'Adjusted: halved swap size.' };
  }
  return { action: 'hold', details: null, expectedAPY: 0, expectedReturn1Year: 0, reasoning: 'Defaulted to hold.' };
}

function generateDeterministicCritique(
  violations: string[],
  estimatedMaxIL: number,
  round: number,
  prefs: UserPreferences
): string {
  if (violations.length === 0) {
    return `Round ${round}: Strategy passes all risk checks. Estimated max IL: ${estimatedMaxIL.toFixed(2)}%. APPROVED.`;
  }

  const prefix = round <= 3 ? 'REJECTED' : round <= 6 ? 'CONCERNS' : round >= 10 ? 'FINAL ASSESSMENT' : 'NEGOTIATING';
  return `${prefix} (Round ${round}): ${violations.join('; ')}. ` +
    `Please address these concerns to stay within the ${prefs.maxImpermanentLoss}% IL and ${prefs.maxPositionSize}% position limits.`;
}

function logRiskValidation(validation: RiskValidation, round: number): void {
  console.log('✅ RISK VALIDATION COMPLETE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🛡️  Round ${round} — ${validation.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`🛡️  Risk Score: ${(validation.riskScore * 100).toFixed(0)}/100`);
  console.log(`🛡️  Max IL: ${validation.estimatedMaxIL.toFixed(2)}%`);
  if (validation.violations.length > 0) {
    console.log(`⚠️  Violations: ${validation.violations.join(' | ')}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
