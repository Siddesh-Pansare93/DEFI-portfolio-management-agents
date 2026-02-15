import { StateGraph } from '@langchain/langgraph';
import { WorkflowState } from './types';
import { runDataCollector } from './agents/data-collector';
import { runMarketAnalyzer } from './agents/market-analyzer';
import { runStrategyProposer } from './agents/strategy-proposer';
import { runRiskValidator } from './agents/risk-validator';
import { nashNegotiator } from './agents/negotiator';
import { config } from './utils/config';

// ============================================================================
// LANGGRAPH WORKFLOW DEFINITION
// ============================================================================

/**
 * Create the LangGraph workflow for agent orchestration
 *
 * Workflow Flow:
 * START → Data Collector → Market Analyzer → Strategy Proposer
 *   → Risk Validator → Nash Negotiator → END
 *
 * State Management:
 * - State flows through each agent sequentially
 * - Each agent reads from state and adds its output
 * - State accumulates data at each step
 *
 * @returns Compiled LangGraph workflow
 */
export function createWorkflow() {
  console.log('🔧 Creating LangGraph workflow...\n');

  // ========================================================================
  // STEP 1: Initialize StateGraph with WorkflowState type
  // ========================================================================

  const workflow = new StateGraph<WorkflowState>({
    channels: {
      walletAddress: {
        value: (left?: string, right?: string) => right ?? left ?? '',
        default: () => ''
      },
      portfolio: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      marketAnalysis: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      strategyProposal: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      riskValidation: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      },
      finalRecommendation: {
        value: (left?: any, right?: any) => right ?? left ?? null,
        default: () => null
      }
    }
  });

  // ========================================================================
  // STEP 2: Add agent nodes to the workflow
  // ========================================================================

  // Node 1: Data Collection Agent
  workflow.addNode('dataCollector', runDataCollector);

  // Node 2: Market Analyzer Agent
  workflow.addNode('marketAnalyzer', runMarketAnalyzer);

  // Node 3: Strategy Proposer Agent
  workflow.addNode('strategyProposer', runStrategyProposer);

  // Node 4: Risk Validator Agent
  workflow.addNode('riskValidator', runRiskValidator);

  // Node 5: Nash Negotiator (Deterministic)
  workflow.addNode('negotiator', nashNegotiator);

  // ========================================================================
  // STEP 3: Define edges (sequential execution flow)
  // ========================================================================

  // Start → Data Collector
  (workflow as any).addEdge('__start__', 'dataCollector');

  // Data Collector → Market Analyzer
  (workflow as any).addEdge('dataCollector', 'marketAnalyzer');

  // Market Analyzer → Strategy Proposer
  (workflow as any).addEdge('marketAnalyzer', 'strategyProposer');

  // Strategy Proposer → Risk Validator
  (workflow as any).addEdge('strategyProposer', 'riskValidator');

  // Risk Validator → Negotiator
  (workflow as any).addEdge('riskValidator', 'negotiator');

  // Negotiator → End
  (workflow as any).addEdge('negotiator', '__end__');

  // ========================================================================
  // STEP 4: Compile the workflow
  // ========================================================================

  const compiledWorkflow = workflow.compile();

  console.log('✅ Workflow created successfully');
  console.log('📊 Agents: Data Collector → Market Analyzer → Strategy Proposer → Risk Validator → Negotiator\n');

  return compiledWorkflow;
}

// ============================================================================
// WORKFLOW EXECUTION FUNCTION
// ============================================================================

/**
 * Execute the complete agent workflow for a wallet address
 *
 * @param walletAddress - Ethereum wallet address to analyze
 * @returns Final workflow state with recommendation
 *
 * Features:
 * - Sequential agent execution
 * - State accumulation at each step
 * - Timeout protection (2 minutes)
 * - Error handling and logging
 *
 * @example
 * const result = await executeWorkflow('0x1234...');
 * console.log('Recommendation:', result.finalRecommendation);
 */
export async function executeWorkflow(walletAddress: string): Promise<WorkflowState> {
  console.log('\n' + '═'.repeat(80));
  console.log('🚀 AUTONOMOUS DEFI AGENT WORKFLOW EXECUTION');
  console.log('═'.repeat(80));
  console.log(`📍 Wallet Address: ${walletAddress}`);
  console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    // ========================================================================
    // STEP 1: Create the workflow
    // ========================================================================

    const workflow = createWorkflow();

    // ========================================================================
    // STEP 2: Prepare initial state
    // ========================================================================

    const initialState: WorkflowState = {
      walletAddress,
      portfolio: null,
      marketAnalysis: null,
      strategyProposal: null,
      riskValidation: null,
      finalRecommendation: null
    };

    console.log('📝 Initial State:');
    console.log(`   Wallet: ${walletAddress}`);
    console.log(`   Portfolio: null`);
    console.log(`   Market Analysis: null`);
    console.log(`   Strategy: null`);
    console.log(`   Risk Validation: null`);
    console.log(`   Final Recommendation: null\n`);

    // ========================================================================
    // STEP 3: Execute workflow with timeout protection
    // ========================================================================

    console.log('⏳ Executing workflow with timeout protection...\n');

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Workflow timeout: Execution exceeded ${config.workflowTimeout / 1000} seconds`));
      }, config.workflowTimeout);
    });

    const workflowPromise = workflow.invoke(initialState as any);

    // Race between workflow execution and timeout
    const finalState = await Promise.race([
      workflowPromise,
      timeoutPromise
    ]) as unknown as WorkflowState;

    // ========================================================================
    // STEP 4: Validate final state
    // ========================================================================

    if (!finalState.finalRecommendation) {
      throw new Error('Workflow completed but no final recommendation was generated');
    }

    // ========================================================================
    // STEP 5: Log completion summary
    // ========================================================================

    console.log('\n' + '═'.repeat(80));
    console.log('✅ WORKFLOW EXECUTION COMPLETE');
    console.log('═'.repeat(80));
    console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`);
    console.log(`\n📊 Final State Summary:`);
    console.log(`   ✅ Portfolio: ${finalState.portfolio ? 'COLLECTED' : 'MISSING'}`);
    console.log(`   ✅ Market Analysis: ${finalState.marketAnalysis ? 'COMPLETE' : 'MISSING'}`);
    console.log(`   ✅ Strategy: ${finalState.strategyProposal ? 'PROPOSED' : 'MISSING'}`);
    console.log(`   ✅ Risk Validation: ${finalState.riskValidation ? 'VALIDATED' : 'MISSING'}`);
    console.log(`   ✅ Final Recommendation: ${finalState.finalRecommendation ? 'GENERATED' : 'MISSING'}`);
    console.log('\n🎯 FINAL RECOMMENDATION:');
    console.log(`   Action: ${finalState.finalRecommendation.action.toUpperCase().replace('_', ' ')}`);
    console.log(`   Expected APY: ${(finalState.finalRecommendation.expectedAPY * 100).toFixed(2)}%`);
    console.log(`   Max Risk: ${finalState.finalRecommendation.maxRisk.toFixed(2)}%`);
    console.log(`   Confidence: ${(finalState.finalRecommendation.confidence * 100).toFixed(0)}%`);
    console.log('═'.repeat(80) + '\n');

    return finalState;

  } catch (error) {
    console.error('\n' + '═'.repeat(80));
    console.error('❌ WORKFLOW EXECUTION FAILED');
    console.error('═'.repeat(80));
    console.error(`⏰ Failed at: ${new Date().toLocaleTimeString()}`);
    console.error(`❌ Error: ${(error as Error).message}`);
    console.error('═'.repeat(80) + '\n');

    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get workflow execution statistics
 *
 * @param state - Final workflow state
 * @returns Execution statistics
 */
export function getWorkflowStats(state: WorkflowState): {
  stepsCompleted: number;
  totalSteps: number;
  completionRate: number;
} {
  const steps = [
    state.portfolio !== null,
    state.marketAnalysis !== null,
    state.strategyProposal !== null,
    state.riskValidation !== null,
    state.finalRecommendation !== null
  ];

  const stepsCompleted = steps.filter(Boolean).length;
  const totalSteps = 5;
  const completionRate = stepsCompleted / totalSteps;

  return {
    stepsCompleted,
    totalSteps,
    completionRate
  };
}

/**
 * Check if workflow completed successfully
 *
 * @param state - Workflow state to check
 * @returns true if all steps completed
 */
export function isWorkflowComplete(state: WorkflowState): boolean {
  return !!(
    state.portfolio &&
    state.marketAnalysis &&
    state.strategyProposal &&
    state.riskValidation &&
    state.finalRecommendation
  );
}

/**
 * Get current workflow step name
 *
 * @param state - Current workflow state
 * @returns Name of the current/last completed step
 */
export function getCurrentStep(state: WorkflowState): string {
  if (state.finalRecommendation) return 'Negotiator (Complete)';
  if (state.riskValidation) return 'Risk Validator';
  if (state.strategyProposal) return 'Strategy Proposer';
  if (state.marketAnalysis) return 'Market Analyzer';
  if (state.portfolio) return 'Data Collector';
  return 'Not Started';
}
