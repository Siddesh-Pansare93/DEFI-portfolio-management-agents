import { WorkflowState, FinalRecommendation, StrategyProposal, AddLiquidityDetails, NegotiationMessage } from '../types';
import { config } from '../utils/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// ============================================================================
// NASH NEGOTIATOR (Deterministic Nash + Gemini Explanation)
// ============================================================================

/**
 * Nash Bargaining Negotiator
 *
 * Algorithm: Nash bargaining solution (deterministic math for the decision)
 * Enhancement: Gemini LLM for writing the final explanation
 *
 * Decision Rules (unchanged):
 * 1. Both approved → Accept original strategy
 * 2. Too risky → Use risk-adjusted strategy or hold
 * 3. Moderate → Blend 60/40 safety weighting
 */
export async function nashNegotiator(state: WorkflowState): Promise<WorkflowState> {
  const totalRounds = state.negotiationRound || 1;

  console.log('\n🤝 ========================================');
  console.log(`🤝 NASH NEGOTIATOR (after ${totalRounds} round${totalRounds > 1 ? 's' : ''})`);
  console.log('🤝 ========================================\n');

  try {
    if (!state.strategyProposal) throw new Error('Strategy proposal required');
    if (!state.riskValidation) throw new Error('Risk validation required');

    const { strategyProposal, riskValidation } = state;

    // ========================================================================
    // STEP 1: Calculate utilities (Nash math — deterministic)
    // ========================================================================

    const returnUtility = Math.min(strategyProposal.expectedAPY / 0.30, 1);
    const safetyUtility = 1 - riskValidation.riskScore;

    console.log('📊 Utility Calculations:');
    console.log(`   Return Utility: ${(returnUtility * 100).toFixed(0)}/100 (APY: ${(strategyProposal.expectedAPY * 100).toFixed(2)}%)`);
    console.log(`   Safety Utility: ${(safetyUtility * 100).toFixed(0)}/100 (Risk: ${(riskValidation.riskScore * 100).toFixed(0)}/100)\n`);

    // ========================================================================
    // STEP 2: Apply Nash decision rules
    // ========================================================================

    let finalRecommendation: FinalRecommendation;
    let decisionReason: string;

    if (riskValidation.approved && returnUtility > 0.10 && safetyUtility > 0.6) {
      console.log('✅ Decision: ACCEPT ORIGINAL STRATEGY\n');
      finalRecommendation = {
        action: strategyProposal.action,
        details: strategyProposal.details,
        expectedAPY: strategyProposal.expectedAPY,
        maxRisk: riskValidation.estimatedMaxIL,
        confidence: returnUtility * safetyUtility,
        explanation: '',
        negotiationRounds: totalRounds
      };
      decisionReason = 'Original strategy accepted — optimal balance of returns and safety';

    } else if (!riskValidation.approved || safetyUtility < 0.4) {
      console.log('⚠️  Decision: USE RISK-ADJUSTED STRATEGY\n');

      if (riskValidation.adjustedStrategy) {
        finalRecommendation = {
          action: riskValidation.adjustedStrategy.action,
          details: riskValidation.adjustedStrategy.details,
          expectedAPY: riskValidation.adjustedStrategy.expectedAPY,
          maxRisk: riskValidation.estimatedMaxIL * 0.7,
          confidence: safetyUtility,
          explanation: '',
          negotiationRounds: totalRounds
        };
        decisionReason = 'Risk-adjusted strategy adopted for safety';
      } else {
        finalRecommendation = {
          action: 'hold',
          details: null,
          expectedAPY: 0,
          maxRisk: 0,
          confidence: 0.5,
          explanation: '',
          negotiationRounds: totalRounds
        };
        decisionReason = 'Hold — original too risky, no safe adjustment available';
      }

    } else {
      console.log('🔄 Decision: BLEND STRATEGIES\n');
      finalRecommendation = blendStrategies(strategyProposal, riskValidation.adjustedStrategy, safetyUtility);
      finalRecommendation.negotiationRounds = totalRounds;
      decisionReason = 'Blended — balanced compromise between return and safety';
    }

    // ========================================================================
    // STEP 3: Log final Nash message
    // ========================================================================

    const nashMessage: NegotiationMessage = {
      round: totalRounds,
      from: 'NashNegotiator',
      type: 'final_decision',
      content: `Nash Equilibrium reached after ${totalRounds} round${totalRounds > 1 ? 's' : ''}. Decision: ${decisionReason}.`,
      keyPoints: [
        `Action: ${finalRecommendation.action.replace('_', ' ').toUpperCase()}`,
        `Expected APY: ${(finalRecommendation.expectedAPY * 100).toFixed(2)}%`,
        `Confidence: ${(finalRecommendation.confidence * 100).toFixed(0)}%`,
        `Rounds taken: ${totalRounds}`
      ],
      timestamp: new Date()
    };

    // ========================================================================
    // STEP 4: Generate Gemini explanation
    // ========================================================================

    try {
      const nashExplanation = await generateNashExplanation(
        state,
        finalRecommendation,
        totalRounds,
        decisionReason
      );
      finalRecommendation.explanation = nashExplanation;
      finalRecommendation.nashExplanation = nashExplanation;
      console.log('✅ Gemini explanation generated\n');
    } catch (err) {
      console.warn('⚠️  Gemini explanation failed:', (err as Error).message);
      finalRecommendation.explanation = generateDeterministicExplanation(
        finalRecommendation, state, totalRounds, decisionReason
      );
    }

    // ========================================================================
    // STEP 5: Log summary
    // ========================================================================

    console.log('✅ FINAL RECOMMENDATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Action: ${finalRecommendation.action.toUpperCase().replace('_', ' ')}`);
    console.log(`📊 Expected APY: ${(finalRecommendation.expectedAPY * 100).toFixed(2)}%`);
    console.log(`🛡️  Max Risk (IL): ${finalRecommendation.maxRisk.toFixed(2)}%`);
    console.log(`💯 Confidence: ${(finalRecommendation.confidence * 100).toFixed(0)}%`);
    console.log(`🔄 Negotiation Rounds: ${totalRounds}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================================================
    // STEP 6: Return final state
    // ========================================================================

    const allMessages = [...(state.negotiationMessages || []), nashMessage];

    return {
      ...state,
      finalRecommendation,
      negotiationMessages: allMessages
    };

  } catch (error) {
    console.error('❌ Nash Negotiator failed:', error);
    throw new Error(`Nash Negotiator error: ${(error as Error).message}`);
  }
}

// ============================================================================
// GEMINI EXPLANATION
// ============================================================================

async function generateNashExplanation(
  state: WorkflowState,
  decision: FinalRecommendation,
  rounds: number,
  decisionReason: string
): Promise<string> {
  const llm = new ChatGoogleGenerativeAI({
    model: config.geminiModel,
    apiKey: config.googleApiKey,
    temperature: 0.5, // Slightly higher for more natural explanation
  });

  const messages = state.negotiationMessages || [];
  const proposerMessages = messages.filter(m => m.from === 'StrategyProposer');
  const validatorMessages = messages.filter(m => m.from === 'RiskValidator');

  const conversationSummary = messages.slice(0, 6).map(m =>
    `[Round ${m.round} - ${m.from}] ${m.type.toUpperCase()}: ${m.keyPoints.join(' | ')}`
  ).join('\n');

  const systemPrompt = `You are a neutral DeFi advisor summarizing a negotiation between a Strategy Proposer and Risk Validator. Write clearly and professionally for a retail DeFi user.`;

  const userPrompt = `You mediated a ${rounds}-round negotiation to find the best DeFi strategy.

NEGOTIATION SUMMARY:
${conversationSummary}

FINAL DECISION: ${decisionReason}
- Action: ${decision.action.replace('_', ' ').toUpperCase()}
- Expected APY: ${(decision.expectedAPY * 100).toFixed(2)}%
- Max IL risk: ${decision.maxRisk.toFixed(2)}%
- Confidence: ${(decision.confidence * 100).toFixed(0)}%

Write a 3-paragraph final report:
1. What was debated during negotiation (specific concerns raised)
2. Why this final recommendation was chosen over alternatives
3. What the user should do and what risks to monitor going forward

Be direct and helpful. Use plain language.`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ]);

  return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function blendStrategies(
  strategy1: StrategyProposal,
  strategy2: StrategyProposal | null,
  safetyWeight: number
): FinalRecommendation {
  if (!strategy2) {
    return {
      action: strategy1.action,
      details: reduceStrategySize(strategy1.details, 0.7),
      expectedAPY: strategy1.expectedAPY * 0.7,
      maxRisk: strategy1.expectedAPY > 0 ? 8 : 0,
      confidence: 0.6,
      explanation: ''
    };
  }

  const returnWeight = 1 - safetyWeight;
  const blendedAPY = strategy1.expectedAPY * returnWeight + strategy2.expectedAPY * safetyWeight;
  const baseStrategy = safetyWeight > 0.5 ? strategy2 : strategy1;

  return {
    action: baseStrategy.action,
    details: baseStrategy.details,
    expectedAPY: blendedAPY,
    maxRisk: Math.max(5, Math.min(10, blendedAPY * 50)),
    confidence: 0.7,
    explanation: ''
  };
}

function reduceStrategySize(details: any, factor: number): any {
  if (!details) return null;
  if ('ethAmount' in details && 'usdcAmount' in details) {
    return { ...details, ethAmount: details.ethAmount * factor, usdcAmount: details.usdcAmount * factor };
  } else if ('amount' in details) {
    return { ...details, amount: details.amount * factor };
  }
  return details;
}

function generateDeterministicExplanation(
  decision: FinalRecommendation,
  state: WorkflowState,
  rounds: number,
  reason: string
): string {
  const marketTrend = state.marketAnalysis?.ethTrend || 'neutral';
  const fearGreed = state.marketAnalysis?.fearGreedIndex || 50;

  return `After ${rounds} round${rounds > 1 ? 's' : ''} of negotiation, the agents reached consensus on a ${decision.action.replace('_', ' ')} strategy. ` +
    `The Strategy Proposer and Risk Validator balanced expected returns (${(decision.expectedAPY * 100).toFixed(2)}% APY) against risk (max IL: ${decision.maxRisk.toFixed(2)}%). ` +
    `Market conditions show ${marketTrend} trend with Fear & Greed at ${fearGreed}/100. ` +
    `Outcome: ${reason}. Confidence: ${(decision.confidence * 100).toFixed(0)}%.`;
}
