import { config } from './utils/config';
import { executeWorkflow } from './workflow';

// ============================================================================
// COMPREHENSIVE TEST SUITE
// ============================================================================

console.log('\n' + '═'.repeat(80));
console.log('🧪 AUTONOMOUS DEFI AGENTS - COMPREHENSIVE TEST SUITE');
console.log('═'.repeat(80) + '\n');

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

// Test wallet address (replace with a real Sepolia wallet that has some ETH/USDC)
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4'; // Example Vitalik's address

console.log('📋 Test Configuration:');
console.log(`   Wallet: ${TEST_WALLET}`);
console.log(`   Network: Sepolia Testnet (Chain ID: ${config.chainId})`);
console.log(`   RPC: ${config.sepoliaRpcUrl}`);
console.log(`   Google API Key: ${config.googleApiKey ? '✅ Configured' : '❌ Missing'}`);
console.log(`   CoinGecko API Key: ${config.coingeckoApiKey ? '✅ Configured' : '⚠️  Optional (not set)'}\n`);

// ============================================================================
// PHASE 1: TEST INDIVIDUAL TOOLS
// ============================================================================

async function testTools() {
  console.log('━'.repeat(80));
  console.log('📦 PHASE 1: TESTING INDIVIDUAL TOOLS');
  console.log('━'.repeat(80) + '\n');

  try {
    // Test 1: Balance Reader
    console.log('🔍 Test 1: Balance Reader');
    console.log('─'.repeat(40));
    const { getEthBalance, getErc20Balance } = await import('./tools/balance-reader');

    const ethBalance = await getEthBalance(TEST_WALLET);
    console.log(`✅ ETH Balance: ${ethBalance.toFixed(4)} ETH\n`);

    const usdcBalance = await getErc20Balance(TEST_WALLET, config.usdcAddress);
    console.log(`✅ USDC Balance: ${usdcBalance.toFixed(2)} USDC\n`);

    // Test 2: Price Fetcher
    console.log('🔍 Test 2: Price Fetcher');
    console.log('─'.repeat(40));
    const { getTokenPrice, getPriceHistory } = await import('./tools/price-fetcher');

    const ethPrice = await getTokenPrice('ethereum');
    console.log(`✅ ETH Price: $${ethPrice.toFixed(2)}\n`);

    const usdcPrice = await getTokenPrice('usd-coin');
    console.log(`✅ USDC Price: $${usdcPrice.toFixed(4)}\n`);

    const priceHistory = await getPriceHistory('ethereum', 7);
    console.log(`✅ Price History: Retrieved ${priceHistory.length} data points (7 days)\n`);

    // Test 3: Pool Data
    console.log('🔍 Test 3: Pool Data (The Graph)');
    console.log('─'.repeat(40));
    const { getUniswapPoolData } = await import('./tools/pool-data');

    const poolData = await getUniswapPoolData(config.uniswapPoolAddress);
    console.log(`✅ Pool Liquidity: $${poolData.liquidity.toLocaleString()}`);
    console.log(`✅ 24h Volume: $${poolData.volumeUSD.toLocaleString()}`);
    console.log(`✅ 24h Fees: $${poolData.feesUSD.toLocaleString()}\n`);

    // Test 4: Analysis Tools
    console.log('🔍 Test 4: Analysis Tools');
    console.log('─'.repeat(40));
    const {
      calculateVolatility,
      calculateOptimalRange,
      estimateUniswapAPY,
      calculateImpermanentLoss,
      checkPositionLimits
    } = await import('./tools/analysis');

    // Test volatility calculation
    const volatility = calculateVolatility(priceHistory);
    console.log(`✅ Volatility (7-day): ${volatility.toFixed(2)}%`);

    // Test optimal range calculation
    const optimalRange = calculateOptimalRange(ethPrice, volatility, 1.5);
    console.log(`✅ Optimal Range: $${optimalRange.lowerPrice.toFixed(2)} - $${optimalRange.upperPrice.toFixed(2)}`);

    // Test APY estimation
    const estimatedAPY = estimateUniswapAPY(
      poolData.feesUSD,
      poolData.liquidity,
      10000 // $10k position
    );
    console.log(`✅ Estimated APY: ${estimatedAPY.toFixed(2)}%`);

    // Test IL calculation
    const il = calculateImpermanentLoss(1.2); // 20% price increase
    console.log(`✅ IL (20% price change): ${il.toFixed(2)}%`);

    // Test position limits
    const positionCheck = checkPositionLimits(
      0.5,      // 0.5 ETH
      1000,     // 1000 USDC
      1.0,      // 1.0 ETH balance
      2000,     // 2000 USDC balance
      ethPrice
    );
    console.log(`✅ Position Limits Check: ${positionCheck.valid ? 'PASS' : 'FAIL'}`);
    if (positionCheck.violations.length > 0) {
      console.log(`   Violations: ${positionCheck.violations.join(', ')}`);
    }
    console.log('\n');

    console.log('✅ PHASE 1 COMPLETE: All tools working correctly!\n');
    return true;

  } catch (error) {
    console.error('❌ PHASE 1 FAILED:', (error as Error).message);
    console.error('Stack:', (error as Error).stack);
    return false;
  }
}

// ============================================================================
// PHASE 2: TEST INDIVIDUAL AGENTS
// ============================================================================

async function testAgents() {
  console.log('━'.repeat(80));
  console.log('🤖 PHASE 2: TESTING INDIVIDUAL AGENTS');
  console.log('━'.repeat(80) + '\n');

  try {
    // Import all agents
    const { runDataCollector } = await import('./agents/data-collector');
    const { runMarketAnalyzer } = await import('./agents/market-analyzer');
    const { runStrategyProposer } = await import('./agents/strategy-proposer');
    const { runRiskValidator } = await import('./agents/risk-validator');
    const { nashNegotiator } = await import('./agents/negotiator');

    // Initialize state
    let state: any = {
      walletAddress: TEST_WALLET,
      portfolio: null,
      marketAnalysis: null,
      strategyProposal: null,
      riskValidation: null,
      finalRecommendation: null
    };

    // Test Agent 1: Data Collector
    console.log('🔍 Test Agent 1: Data Collector');
    console.log('─'.repeat(40));
    state = await runDataCollector(state);
    console.log(`✅ Portfolio collected: $${state.portfolio.totalValueUSD.toFixed(2)} total value\n`);

    // Test Agent 2: Market Analyzer
    console.log('🔍 Test Agent 2: Market Analyzer');
    console.log('─'.repeat(40));
    state = await runMarketAnalyzer(state);
    console.log(`✅ Market analyzed: ${state.marketAnalysis.ethTrend} trend, ${state.marketAnalysis.volatility.toFixed(2)}% volatility\n`);

    // Test Agent 3: Strategy Proposer
    console.log('🔍 Test Agent 3: Strategy Proposer');
    console.log('─'.repeat(40));
    state = await runStrategyProposer(state);
    console.log(`✅ Strategy proposed: ${state.strategyProposal.action.toUpperCase()}, ${(state.strategyProposal.expectedAPY * 100).toFixed(2)}% expected APY\n`);

    // Test Agent 4: Risk Validator
    console.log('🔍 Test Agent 4: Risk Validator');
    console.log('─'.repeat(40));
    state = await runRiskValidator(state);
    console.log(`✅ Risk validated: ${state.riskValidation.approved ? 'APPROVED' : 'REJECTED'}, ${(state.riskValidation.riskScore * 100).toFixed(0)}/100 risk score\n`);

    // Test Agent 5: Nash Negotiator
    console.log('🔍 Test Agent 5: Nash Negotiator (Deterministic)');
    console.log('─'.repeat(40));
    state = nashNegotiator(state);
    console.log(`✅ Final recommendation: ${state.finalRecommendation.action.toUpperCase()}, ${(state.finalRecommendation.confidence * 100).toFixed(0)}% confidence\n`);

    console.log('✅ PHASE 2 COMPLETE: All agents working correctly!\n');
    return true;

  } catch (error) {
    console.error('❌ PHASE 2 FAILED:', (error as Error).message);
    console.error('Stack:', (error as Error).stack);
    return false;
  }
}

// ============================================================================
// PHASE 3: TEST COMPLETE WORKFLOW
// ============================================================================

async function testWorkflow() {
  console.log('━'.repeat(80));
  console.log('🔄 PHASE 3: TESTING COMPLETE WORKFLOW');
  console.log('━'.repeat(80) + '\n');

  try {
    console.log(`🚀 Executing complete workflow for wallet: ${TEST_WALLET}\n`);

    const finalState = await executeWorkflow(TEST_WALLET);

    console.log('\n✅ PHASE 3 COMPLETE: Workflow executed successfully!\n');

    // Display summary
    console.log('━'.repeat(80));
    console.log('📊 WORKFLOW RESULTS SUMMARY');
    console.log('━'.repeat(80));
    console.log(`\n💰 Portfolio Value: $${finalState.portfolio?.totalValueUSD.toFixed(2)}`);
    console.log(`📈 Market Trend: ${finalState.marketAnalysis?.ethTrend}`);
    console.log(`📊 Volatility: ${finalState.marketAnalysis?.volatility.toFixed(2)}%`);
    console.log(`🎯 Proposed Strategy: ${finalState.strategyProposal?.action.toUpperCase()}`);
    console.log(`🛡️  Risk Status: ${finalState.riskValidation?.approved ? 'APPROVED ✅' : 'REJECTED ❌'}`);
    console.log(`\n🏆 FINAL RECOMMENDATION:`);
    console.log(`   Action: ${finalState.finalRecommendation?.action.toUpperCase()}`);
    console.log(`   Expected APY: ${(finalState.finalRecommendation!.expectedAPY * 100).toFixed(2)}%`);
    console.log(`   Max Risk (IL): ${finalState.finalRecommendation?.maxRisk.toFixed(2)}%`);
    console.log(`   Confidence: ${(finalState.finalRecommendation!.confidence * 100).toFixed(0)}%`);
    console.log('\n' + '━'.repeat(80) + '\n');

    return true;

  } catch (error) {
    console.error('❌ PHASE 3 FAILED:', (error as Error).message);
    console.error('Stack:', (error as Error).stack);
    return false;
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  const startTime = Date.now();

  console.log('⏰ Test Suite Started at:', new Date().toLocaleTimeString());
  console.log('═'.repeat(80) + '\n');

  // Phase 1: Test Tools
  const toolsPass = await testTools();
  if (!toolsPass) {
    console.error('\n❌ TESTING ABORTED: Tools failed. Fix tools before testing agents.\n');
    process.exit(1);
  }

  // Phase 2: Test Individual Agents
  const agentsPass = await testAgents();
  if (!agentsPass) {
    console.error('\n❌ TESTING ABORTED: Agents failed. Fix agents before testing workflow.\n');
    process.exit(1);
  }

  // Phase 3: Test Complete Workflow
  const workflowPass = await testWorkflow();

  // Final Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('═'.repeat(80));
  console.log('🎉 ALL TESTS COMPLETE!');
  console.log('═'.repeat(80));
  console.log(`\n✅ Phase 1 (Tools): ${toolsPass ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Phase 2 (Agents): ${agentsPass ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Phase 3 (Workflow): ${workflowPass ? 'PASS' : 'FAIL'}`);
  console.log(`\n⏱️  Total Duration: ${duration} seconds`);
  console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`);
  console.log('\n' + '═'.repeat(80) + '\n');

  if (toolsPass && agentsPass && workflowPass) {
    console.log('🎊 SUCCESS: All systems operational! Ready for Phase 5 (Express API)\n');
    process.exit(0);
  } else {
    console.error('❌ FAILURE: Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
