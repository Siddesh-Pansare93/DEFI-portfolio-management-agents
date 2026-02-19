import { WorkflowState, StrategyProposal, AddLiquidityDetails, NegotiationMessage, UserPreferences } from '../types';
import { calculateOptimalRange, estimateUniswapAPY } from '../tools/analysis';
import { config } from '../utils/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// ============================================================================
// STRATEGY PROPOSER AGENT (Gemini LLM + Round-Aware Negotiation)
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  maxImpermanentLoss: 10,
  maxPositionSize: 70,
  riskAppetite: 'moderate',
  preferredActions: ['add_liquidity', 'swap', 'hold']
};

/**
 * Strategy Proposer Agent
 *
 * Purpose: Propose or refine portfolio strategies using Gemini LLM
 *
 * Round 1: Propose optimal strategy based on market analysis
 * Round 2+: Refine based on Risk Validator's critique
 */
export async function runStrategyProposer(state: WorkflowState): Promise<WorkflowState> {
  const round = (state.negotiationRound || 0) + 1;

  console.log('\n💡 ========================================');
  console.log(`💡 AGENT 3: STRATEGY PROPOSER (Round ${round})`);
  console.log('💡 ========================================\n');

  try {
    if (!state.portfolio) throw new Error('Portfolio data required for strategy proposal');
    if (!state.marketAnalysis) throw new Error('Market analysis required for strategy proposal');

    const { portfolio, marketAnalysis, negotiationMessages } = state;
    const prefs = state.userPreferences || DEFAULT_PREFERENCES;

    // ========================================================================
    // STEP 1: Build deterministic strategy as base
    // ========================================================================

    const deterministicStrategy = buildDeterministicStrategy(state, prefs);

    // ========================================================================
    // STEP 2: Try Gemini for enhanced reasoning
    // ========================================================================

    let strategyProposal: StrategyProposal;

    try {
      const geminiResult = await proposeWithGemini(
        state,
        prefs,
        round,
        deterministicStrategy,
        negotiationMessages || []
      );
      strategyProposal = geminiResult;
      console.log(`✅ Gemini strategy proposal (Round ${round}) complete\n`);
    } catch (err) {
      console.warn('⚠️  Gemini strategy failed, using deterministic fallback:', (err as Error).message);
      strategyProposal = deterministicStrategy;
    }

    strategyProposal.version = round;

    // ========================================================================
    // STEP 3: Log negotiation message
    // ========================================================================

    const msgType = round === 1 ? 'proposal' : 'refinement';
    const negotiationMessage: NegotiationMessage = {
      round,
      from: 'StrategyProposer',
      type: msgType,
      content: strategyProposal.geminiReasoning || strategyProposal.reasoning,
      proposalRef: `v${round}`,
      keyPoints: extractKeyPoints(strategyProposal),
      timestamp: new Date()
    };

    // ========================================================================
    // STEP 4: Log results
    // ========================================================================

    console.log('✅ STRATEGY PROPOSAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Action: ${strategyProposal.action.toUpperCase().replace('_', ' ')} (v${round})`);
    if (strategyProposal.action === 'add_liquidity' && strategyProposal.details) {
      const d = strategyProposal.details as AddLiquidityDetails;
      console.log(`   ETH: ${d.ethAmount.toFixed(4)} | USDC: ${d.usdcAmount.toFixed(2)}`);
      console.log(`   Range: $${d.priceRangeLower.toFixed(2)} - $${d.priceRangeUpper.toFixed(2)}`);
    }
    console.log(`   Expected APY: ${(strategyProposal.expectedAPY * 100).toFixed(2)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================================================
    // STEP 5: Return updated state
    // ========================================================================

    const allProposals = [...(state.strategyProposals || []), strategyProposal];
    const allMessages = [...(state.negotiationMessages || []), negotiationMessage];

    return {
      ...state,
      strategyProposal,
      currentProposal: strategyProposal,
      strategyProposals: allProposals,
      negotiationRound: round,
      negotiationMessages: allMessages
    };

  } catch (error) {
    console.error('❌ Strategy Proposer Agent failed:', error);
    throw new Error(`Strategy Proposer Agent error: ${(error as Error).message}`);
  }
}

// ============================================================================
// GEMINI STRATEGY GENERATION
// ============================================================================

async function proposeWithGemini(
  state: WorkflowState,
  prefs: UserPreferences,
  round: number,
  deterministicStrategy: StrategyProposal,
  prevMessages: NegotiationMessage[]
): Promise<StrategyProposal> {
  const llm = new ChatGoogleGenerativeAI({
    model: config.geminiModel,
    apiKey: config.googleApiKey,
    temperature: 0.4,
  });

  const { portfolio, marketAnalysis } = state;
  if (!portfolio || !marketAnalysis) throw new Error('State incomplete');

  const topHoldings = portfolio.topHoldings || ['ETH'];
  const topHoldingsText = topHoldings.map(s =>
    `${s}: $${portfolio.holdings[s]?.valueUSD?.toFixed(2) || '0'}`
  ).join(', ');

  let systemPrompt: string;
  let userPrompt: string;

  if (round === 1) {
    systemPrompt = `You are an expert DeFi portfolio manager. Propose ONE specific, optimal strategy with exact numbers. Be confident and thorough. Always output valid JSON matching the specified schema.`;

    userPrompt = `Portfolio: $${portfolio.totalValueUSD.toFixed(2)} total
Top holdings: ${topHoldingsText}
ETH balance: ${portfolio.holdings['ETH']?.balance?.toFixed(4) || '0'} ETH
USDC balance: ${portfolio.holdings['USDC']?.balance?.toFixed(2) || '0'} USDC

Market Analysis:
- ETH trend: ${marketAnalysis.ethTrend} (${marketAnalysis.ethPriceChange30d.toFixed(1)}% 30d)
- RSI: ${marketAnalysis.technicalIndicators.rsi.toFixed(1)}
- Technical signal: ${marketAnalysis.technicalIndicators.signal}
- Fear & Greed: ${marketAnalysis.fearGreedIndex} (${marketAnalysis.fearGreedLabel})
- Volatility: ${marketAnalysis.volatility.toFixed(1)}%

User Preferences:
- Max Impermanent Loss: ${prefs.maxImpermanentLoss}%
- Max Position Size: ${prefs.maxPositionSize}%
- Risk Appetite: ${prefs.riskAppetite}

ETH current price: $${portfolio.holdings['ETH']?.priceUSD?.toFixed(2) || '2000'}

Propose ONE strategy. Output ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "action": "add_liquidity" | "swap" | "hold",
  "details": {
    "pool": "ETH-USDC",
    "ethAmount": <number>,
    "usdcAmount": <number>,
    "priceRangeLower": <number>,
    "priceRangeUpper": <number>
  } | null,
  "expectedAPY": <decimal 0-1>,
  "expectedReturn1Year": <number in USD>,
  "reasoning": "<3-5 sentence explanation citing specific data>"
}`;

  } else {
    const lastCritique = [...prevMessages].reverse().find(m => m.from === 'RiskValidator');
    const prevProposal = state.strategyProposals?.[state.strategyProposals.length - 1];

    const roundTone = round <= 3 ? 'Acknowledge concerns and make targeted adjustments.'
      : round <= 6 ? 'Make genuine concessions. Find common ground.'
      : round <= 9 ? 'Near-agreement. Fine-tune only the flagged issues.'
      : 'Propose the most conservative acceptable option. We must reach agreement.';

    systemPrompt = `You are refining a DeFi strategy after risk feedback. ${roundTone} Always output valid JSON.`;

    userPrompt = `Round ${round} of up to 10.

Previous proposal (v${round - 1}):
- Action: ${prevProposal?.action || 'unknown'}
- Expected APY: ${((prevProposal?.expectedAPY || 0) * 100).toFixed(2)}%

Risk Validator's critique:
${lastCritique?.content || 'No specific critique available.'}

Key concerns: ${lastCritique?.keyPoints.join(' | ') || 'None'}

User preferences: Max IL ${prefs.maxImpermanentLoss}%, Max Position ${prefs.maxPositionSize}%, Appetite: ${prefs.riskAppetite}
ETH price: $${portfolio.holdings['ETH']?.priceUSD?.toFixed(2) || '2000'}
ETH balance: ${portfolio.holdings['ETH']?.balance?.toFixed(4) || '0'}
USDC balance: ${portfolio.holdings['USDC']?.balance?.toFixed(2) || '0'}

Address EACH concern. Output ONLY valid JSON:
{
  "action": "add_liquidity" | "swap" | "hold",
  "details": {
    "pool": "ETH-USDC",
    "ethAmount": <number>,
    "usdcAmount": <number>,
    "priceRangeLower": <number>,
    "priceRangeUpper": <number>
  } | null,
  "expectedAPY": <decimal 0-1>,
  "expectedReturn1Year": <number in USD>,
  "reasoning": "<explain how you addressed each concern with specific numbers>"
}`;
  }

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ]);

  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  // Parse JSON from response
  try {
    // Strip markdown code blocks if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      action: parsed.action || deterministicStrategy.action,
      details: parsed.details || deterministicStrategy.details,
      expectedAPY: typeof parsed.expectedAPY === 'number' ? parsed.expectedAPY : deterministicStrategy.expectedAPY,
      expectedReturn1Year: typeof parsed.expectedReturn1Year === 'number' ? parsed.expectedReturn1Year : deterministicStrategy.expectedReturn1Year,
      reasoning: parsed.reasoning || deterministicStrategy.reasoning,
      geminiReasoning: content,
      version: round
    };
  } catch {
    console.warn('⚠️  Could not parse Gemini JSON, merging with deterministic');
    return {
      ...deterministicStrategy,
      geminiReasoning: content,
      version: round
    };
  }
}

// ============================================================================
// DETERMINISTIC STRATEGY (FALLBACK)
// ============================================================================

function buildDeterministicStrategy(state: WorkflowState, prefs: UserPreferences): StrategyProposal {
  const { portfolio, marketAnalysis } = state;
  if (!portfolio || !marketAnalysis) {
    return { action: 'hold', details: null, expectedAPY: 0, expectedReturn1Year: 0, reasoning: 'Insufficient data.', version: 1 };
  }

  const totalValue = portfolio.totalValueUSD;
  const ethAllocation = portfolio.allocationPercent['ETH'] || 0;
  const ethBalance = portfolio.holdings['ETH']?.balance || 0;
  const usdcBalance = portfolio.holdings['USDC']?.balance || 0;
  const ethPrice = portfolio.holdings['ETH']?.priceUSD || 2000;

  if (totalValue < 100) {
    return {
      action: 'hold', details: null, expectedAPY: 0, expectedReturn1Year: 0,
      reasoning: `Portfolio ($${totalValue.toFixed(2)}) too small for active strategies.`, version: 1
    };
  }

  const canAddLiquidity = marketAnalysis.recommendation !== 'decrease_eth'
    || marketAnalysis.technicalIndicators.signal.includes('buy');

  if (canAddLiquidity && ethBalance > 0.001 && usdcBalance > 10) {
    const lpValue = totalValue * Math.min(0.5, prefs.maxPositionSize / 100);
    const ethAmount = Math.min((lpValue / 2) / ethPrice, ethBalance * 0.8);
    const usdcAmount = Math.min(lpValue / 2, usdcBalance * 0.8);

    const range = calculateOptimalRange(ethPrice, marketAnalysis.volatility, 1.5);
    const poolFeesDaily = portfolio.uniswapPool.feeAPR * portfolio.uniswapPool.liquidity / 365;
    const positionSize = ethAmount * ethPrice + usdcAmount;
    const estimatedAPY = estimateUniswapAPY(poolFeesDaily, portfolio.uniswapPool.liquidity, positionSize) / 100;

    return {
      action: 'add_liquidity',
      details: { pool: 'ETH-USDC', ethAmount, usdcAmount, priceRangeLower: range.lowerPrice, priceRangeUpper: range.upperPrice },
      expectedAPY: estimatedAPY,
      expectedReturn1Year: positionSize * estimatedAPY,
      reasoning: `Market shows ${marketAnalysis.ethTrend} trend (${marketAnalysis.ethPriceChange30d.toFixed(1)}% 30d). Proposing LP position within ${prefs.maxPositionSize}% position limit.`,
      version: 1
    };
  }

  if (marketAnalysis.recommendation === 'decrease_eth' && ethAllocation > 30) {
    const targetAlloc = 0.4;
    const targetEthValue = totalValue * targetAlloc;
    const currentEthValue = ethBalance * ethPrice;
    const swapAmount = Math.min((currentEthValue - targetEthValue) / ethPrice, ethBalance * 0.3);

    return {
      action: 'swap',
      details: { fromToken: 'ETH', toToken: 'USDC', amount: Math.max(0, swapAmount) },
      expectedAPY: 0, expectedReturn1Year: 0,
      reasoning: `Bearish signal (${marketAnalysis.ethTrend}). Reducing ETH from ${ethAllocation.toFixed(1)}% to ~40% for downside protection.`,
      version: 1
    };
  }

  return {
    action: 'hold', details: null, expectedAPY: 0, expectedReturn1Year: 0,
    reasoning: `Conditions don't clearly favor action. ${marketAnalysis.ethTrend} trend with ${marketAnalysis.volatility.toFixed(1)}% volatility. Maintaining current allocation.`,
    version: 1
  };
}

function extractKeyPoints(proposal: StrategyProposal): string[] {
  const points: string[] = [];
  points.push(`Action: ${proposal.action.replace('_', ' ').toUpperCase()}`);
  if (proposal.expectedAPY > 0) {
    points.push(`Expected APY: ${(proposal.expectedAPY * 100).toFixed(2)}%`);
  }
  if (proposal.action === 'add_liquidity' && proposal.details) {
    const d = proposal.details as AddLiquidityDetails;
    points.push(`Range: $${d.priceRangeLower.toFixed(0)} - $${d.priceRangeUpper.toFixed(0)}`);
    points.push(`Position: ${d.ethAmount.toFixed(4)} ETH + $${d.usdcAmount.toFixed(2)} USDC`);
  }
  return points;
}
