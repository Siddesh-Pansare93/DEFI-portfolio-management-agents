import { StateGraph } from '@langchain/langgraph';
import { WorkflowState, UserPreferences } from './types';
import { runDataCollector } from './agents/data-collector';
import { runMarketAnalyzer } from './agents/market-analyzer';
import { runStrategyProposer } from './agents/strategy-proposer';
import { runRiskValidator } from './agents/risk-validator';
import { nashNegotiator } from './agents/negotiator';
import { config } from './utils/config';

// ============================================================================
// NEGOTIATION CONSTANTS
// ============================================================================

const MAX_NEGOTIATION_ROUNDS = 10;

// ============================================================================
// CONDITIONAL ROUTING
// ============================================================================

/**
 * Route after RiskValidator:
 * - Approved OR reached max rounds → go to Nash Negotiator
 * - Not approved AND under max rounds → loop back to Strategy Proposer
 */
function routeAfterRiskValidation(state: WorkflowState): string {
  const { riskValidation, negotiationRound } = state;

  if (riskValidation?.approved) {
    console.log(`\n✅ Risk Validator APPROVED → proceeding to Negotiator\n`);
    return 'negotiator';
  }

  if ((negotiationRound || 0) >= MAX_NEGOTIATION_ROUNDS) {
    console.log(`\n⏱️  Max rounds (${MAX_NEGOTIATION_ROUNDS}) reached → forcing final decision\n`);
    return 'negotiator';
  }

  console.log(`\n🔄 Round ${negotiationRound} rejected → Strategy Proposer refines...\n`);
  return 'strategyProposer';
}

// ============================================================================
// WORKFLOW CREATION
// ============================================================================

/**
 * Create the LangGraph workflow with 10-round negotiation loop
 *
 * Flow:
 * START → Data Collector → Market Analyzer → Strategy Proposer
 *   → Risk Validator → [if approved OR round 10] → Negotiator → END
 *                  ↑ [if rejected and round < 10] ↓
 *                  └──────── Strategy Proposer ←──┘
 */
export function createWorkflow() {
  console.log('🔧 Creating LangGraph workflow with 10-round negotiation...\n');

  const workflow = new StateGraph<WorkflowState>({
    channels: {
      walletAddress: {
        value: (left?: string, right?: string) => right ?? left ?? '',
        default: () => ''
      },
      userPreferences: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      portfolio: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      marketAnalysis: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      deepMarketAnalysis: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      strategyProposal: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      currentProposal: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      strategyProposals: {
        value: (left?: any[], right?: any[]) => right ?? left ?? [],
        default: () => []
      },
      riskValidation: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      negotiationRound: {
        value: (left?: number, right?: number) => right ?? left ?? 0,
        default: () => 0
      },
      negotiationMessages: {
        value: (left?: any[], right?: any[]) => right ?? left ?? [],
        default: () => []
      },
      finalRecommendation: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      }
    }
  });

  // Add agent nodes
  workflow.addNode('dataCollector', runDataCollector);
  workflow.addNode('marketAnalyzer', runMarketAnalyzer);
  workflow.addNode('strategyProposer', runStrategyProposer);
  workflow.addNode('riskValidator', runRiskValidator);
  workflow.addNode('negotiator', nashNegotiator);

  // Sequential edges: start → data → market → strategy
  (workflow as any).addEdge('__start__', 'dataCollector');
  (workflow as any).addEdge('dataCollector', 'marketAnalyzer');
  (workflow as any).addEdge('marketAnalyzer', 'strategyProposer');
  (workflow as any).addEdge('strategyProposer', 'riskValidator');

  // Conditional edge: riskValidator → (negotiator | strategyProposer)
  workflow.addConditionalEdges(
    'riskValidator',
    routeAfterRiskValidation,
    {
      'negotiator': 'negotiator',
      'strategyProposer': 'strategyProposer'
    }
  );

  // Negotiator → end
  (workflow as any).addEdge('negotiator', '__end__');

  const compiledWorkflow = workflow.compile();

  console.log('✅ Workflow created successfully');
  console.log('📊 Flow: Data Collector → Market Analyzer → Strategy Proposer ⇄ Risk Validator (up to 10 rounds) → Nash Negotiator\n');

  return compiledWorkflow;
}

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

/**
 * Execute the complete agent workflow
 *
 * @param walletAddress - Ethereum wallet address
 * @param userPreferences - Optional user risk preferences
 * @returns Final workflow state with recommendation
 */
export async function executeWorkflow(
  walletAddress: string,
  userPreferences?: Partial<UserPreferences>
): Promise<WorkflowState> {
  console.log('\n' + '═'.repeat(80));
  console.log('🚀 AUTONOMOUS DEFI AGENT WORKFLOW EXECUTION');
  console.log('═'.repeat(80));
  console.log(`📍 Wallet: ${walletAddress}`);
  console.log(`⏰ Started: ${new Date().toLocaleTimeString()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    const workflow = createWorkflow();

    const defaultPrefs: UserPreferences = {
      maxImpermanentLoss: 10,
      maxPositionSize: 70,
      riskAppetite: 'moderate',
      preferredActions: ['add_liquidity', 'swap', 'hold']
    };

    const initialState: WorkflowState = {
      walletAddress,
      userPreferences: userPreferences
        ? { ...defaultPrefs, ...userPreferences }
        : defaultPrefs,
      portfolio: null,
      marketAnalysis: null,
      deepMarketAnalysis: null,
      strategyProposal: null,
      currentProposal: null,
      strategyProposals: [],
      riskValidation: null,
      negotiationRound: 0,
      negotiationMessages: [],
      finalRecommendation: null
    };

    // Execute with timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Workflow timeout: Exceeded ${config.workflowTimeout / 1000}s`));
      }, config.workflowTimeout);
    });

    const workflowPromise = workflow.invoke(initialState as any);
    const finalState = await Promise.race([workflowPromise, timeoutPromise]) as unknown as WorkflowState;

    if (!finalState.finalRecommendation) {
      throw new Error('Workflow completed but no final recommendation generated');
    }

    const rounds = finalState.negotiationRound || 1;
    console.log('\n' + '═'.repeat(80));
    console.log('✅ WORKFLOW COMPLETE');
    console.log('═'.repeat(80));
    console.log(`⏰ Completed: ${new Date().toLocaleTimeString()}`);
    console.log(`🔄 Negotiation rounds: ${rounds}`);
    console.log(`🎯 Action: ${finalState.finalRecommendation.action.toUpperCase()}`);
    console.log(`📊 APY: ${(finalState.finalRecommendation.expectedAPY * 100).toFixed(2)}%`);
    console.log(`💯 Confidence: ${(finalState.finalRecommendation.confidence * 100).toFixed(0)}%`);
    console.log('═'.repeat(80) + '\n');

    return finalState;

  } catch (error) {
    console.error('❌ WORKFLOW FAILED:', (error as Error).message);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getWorkflowStats(state: WorkflowState) {
  const steps = [
    state.portfolio !== null,
    state.marketAnalysis !== null,
    state.strategyProposal !== null,
    state.riskValidation !== null,
    state.finalRecommendation !== null
  ];
  const stepsCompleted = steps.filter(Boolean).length;
  return { stepsCompleted, totalSteps: 5, completionRate: stepsCompleted / 5 };
}

export function isWorkflowComplete(state: WorkflowState): boolean {
  return !!(state.portfolio && state.marketAnalysis && state.strategyProposal && state.riskValidation && state.finalRecommendation);
}

export function getCurrentStep(state: WorkflowState): string {
  if (state.finalRecommendation) return 'Negotiator (Complete)';
  if (state.riskValidation) return `Risk Validator (Round ${state.negotiationRound || 1})`;
  if (state.strategyProposal) return `Strategy Proposer (Round ${state.negotiationRound || 1})`;
  if (state.marketAnalysis) return 'Market Analyzer';
  if (state.portfolio) return 'Data Collector';
  return 'Not Started';
}
