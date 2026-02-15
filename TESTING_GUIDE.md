# Testing Guide - Autonomous DeFi Agents

## ✅ What We Fixed Before Testing

### 1. **CoinGecko API Integration**
- **Issue**: `.env` had duplicate `COINGECKO_API_URL` entries
- **Fix**: Separated into:
  - `COINGECKO_API_URL=https://api.coingecko.com/api/v3`
  - `COINGECKO_API_KEY= ********
- **Updated Files**:
  - `agents/.env` - Fixed environment variables
  - `agents/src/utils/config.ts` - Added `coingeckoApiKey` config
  - `agents/src/tools/price-fetcher.ts` - Updated all API calls to include `x_cg_demo_api_key` parameter

### 2. **Test Suite Created**
- **File**: `agents/src/test-all.ts`
- **NPM Script**: `npm run test:all`
- **Coverage**: Tests all tools, agents, and complete workflow

---

## 🧪 How to Run Tests

### **Option 1: Run Complete Test Suite (Recommended)**
```bash
cd agents
npm run test:all
```

This will execute **3 phases** sequentially:
1. ✅ **Phase 1**: Test all individual tools
2. ✅ **Phase 2**: Test all 5 agents individually
3. ✅ **Phase 3**: Test complete end-to-end workflow

### **Option 2: Run Only Type Check**
```bash
cd agents
npm run type-check
```
Verifies TypeScript compilation without runtime execution.

---

## 📊 What Each Test Phase Does

### **Phase 1: Individual Tools Testing**
Tests each foundational tool function:

#### 🔍 **Test 1: Balance Reader**
- ✅ Fetches ETH balance from Sepolia testnet
- ✅ Fetches USDC balance (ERC20)
- **Expected**: Returns balance numbers (may be 0 if wallet is empty)

#### 🔍 **Test 2: Price Fetcher**
- ✅ Fetches current ETH price from CoinGecko
- ✅ Fetches current USDC price
- ✅ Retrieves 7-day price history
- **Expected**: Current prices (~$3000+ for ETH, ~$1.00 for USDC)

#### 🔍 **Test 3: Pool Data**
- ✅ Queries Uniswap V3 ETH-USDC pool from The Graph
- ✅ Gets liquidity, volume, and fees
- **Expected**: Pool statistics from Sepolia testnet

#### 🔍 **Test 4: Analysis Tools**
- ✅ Calculates volatility from price history
- ✅ Computes optimal Uniswap V3 price range
- ✅ Estimates APY from pool fees
- ✅ Calculates impermanent loss
- ✅ Validates position size limits
- **Expected**: All calculations complete successfully

---

### **Phase 2: Individual Agents Testing**
Tests each agent in sequence with accumulated state:

#### 🤖 **Agent 1: Data Collector**
- Gathers portfolio balances, prices, and pool data
- **Output**: Complete portfolio snapshot
- **Expected**: Portfolio value calculated correctly

#### 🤖 **Agent 2: Market Analyzer**
- Analyzes 30-day ETH price trends and volatility
- **Output**: Market trend (bullish/bearish/neutral), volatility percentage
- **Expected**: Market analysis with reasoning

#### 🤖 **Agent 3: Strategy Proposer**
- Proposes strategy: `add_liquidity`, `swap`, or `hold`
- **Output**: Detailed strategy with expected APY
- **Expected**: Strategy matches market conditions

#### 🤖 **Agent 4: Risk Validator**
- Validates strategy against risk limits
- Checks: IL ≤10%, position ≤70%, volatility
- **Output**: Approval status + risk score
- **Expected**: Risk assessment with violations (if any)

#### 🤖 **Agent 5: Nash Negotiator**
- Deterministic decision using Nash bargaining
- Combines strategy + risk using utility functions
- **Output**: Final recommendation with confidence score
- **Expected**: Balanced decision between return and safety

---

### **Phase 3: Complete Workflow Testing**
Tests the entire LangGraph orchestration:

- ✅ Executes all 5 agents sequentially
- ✅ State flows through each step
- ✅ Timeout protection (2 minutes max)
- ✅ Error handling
- **Output**: Complete recommendation with:
  - Action (add_liquidity/swap/hold)
  - Expected APY
  - Max risk (impermanent loss)
  - Confidence score
  - Detailed explanation

---

## ⚠️ Important Notes Before Testing

### **1. Test Wallet Address**
The test uses Vitalik's address by default: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4`

**To use your own wallet**:
- Edit `agents/src/test-all.ts`
- Change line 18: `const TEST_WALLET = 'YOUR_WALLET_ADDRESS';`

### **2. Expected Behavior**
- ✅ **If wallet has ETH/USDC**: Full analysis with real recommendations
- ⚠️ **If wallet is empty**: Will still complete but recommend `hold` strategy
- ❌ **If APIs fail**: Tests will retry 3 times with exponential backoff

### **3. API Requirements**
All these APIs must be accessible:
- ✅ **Alchemy RPC** (Sepolia): For balance fetching
- ✅ **CoinGecko**: For price data (with demo API key)
- ✅ **The Graph**: For Uniswap pool data
- ✅ **Google Gemini**: For AI agent reasoning (currently using your API key)

### **4. Test Duration**
- **Phase 1 (Tools)**: ~15-30 seconds
- **Phase 2 (Agents)**: ~30-60 seconds
- **Phase 3 (Workflow)**: ~45-90 seconds
- **Total**: ~2-3 minutes

### **5. Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| `Missing required environment variable` | Check `.env` file has all required vars |
| `Price not found for ethereum` | CoinGecko API issue - check API key or network |
| `Workflow timeout` | Normal if agents take >2 minutes, increase `config.workflowTimeout` |
| `The Graph query failed` | Sepolia subgraph might be down, retry later |
| `Agent X failed` | Check Google Gemini API key is valid |

---

## 📋 Pre-Flight Checklist

Before running tests, verify:

- [ ] `.env` file exists with all required variables
- [ ] Google Gemini API key is valid: `AIzaSyC4BKdqiSnLUPeQjEVy-NgKuWFntWMQf6c`
- [ ] CoinGecko API key is set: `CG-fSQ93bN88NT6vBvMUHikDgE8`
- [ ] Internet connection is stable
- [ ] Node.js version ≥18 installed
- [ ] All npm packages installed: `npm install` (if not already done)

---

## 🎯 Success Criteria

### **Tests PASS if:**
- ✅ All Phase 1 tools return valid data
- ✅ All Phase 2 agents complete without errors
- ✅ Phase 3 workflow produces a final recommendation
- ✅ No TypeScript compilation errors
- ✅ Total duration < 3 minutes

### **Tests FAIL if:**
- ❌ Any tool throws unhandled errors
- ❌ Agents fail to process state
- ❌ Workflow times out
- ❌ Missing API keys or network issues

---

## 🚀 What Happens After Tests Pass?

Once all tests pass, you're ready for:
- **Phase 5**: Express API Gateway implementation
- **Phase 6**: Frontend integration
- **Full Demo**: Complete end-to-end portfolio analysis

---

## 🔍 Test Output Example

```
🧪 AUTONOMOUS DEFI AGENTS - COMPREHENSIVE TEST SUITE
═══════════════════════════════════════════════════

📦 PHASE 1: TESTING INDIVIDUAL TOOLS
✅ ETH Balance: 1.2345 ETH
✅ USDC Balance: 500.00 USDC
✅ ETH Price: $3245.67
✅ USDC Price: $1.0001
✅ Pool Liquidity: $1,234,567
✅ Volatility (7-day): 23.45%
✅ PHASE 1 COMPLETE!

🤖 PHASE 2: TESTING INDIVIDUAL AGENTS
✅ Portfolio collected: $4,512.34 total value
✅ Market analyzed: bullish trend, 23.45% volatility
✅ Strategy proposed: ADD_LIQUIDITY, 15.23% expected APY
✅ Risk validated: APPROVED, 45/100 risk score
✅ Final recommendation: ADD_LIQUIDITY, 78% confidence
✅ PHASE 2 COMPLETE!

🔄 PHASE 3: TESTING COMPLETE WORKFLOW
🚀 Executing complete workflow...
✅ PHASE 3 COMPLETE!

🎉 ALL TESTS COMPLETE!
✅ Phase 1 (Tools): PASS
✅ Phase 2 (Agents): PASS
✅ Phase 3 (Workflow): PASS
⏱️  Total Duration: 127.45 seconds

🎊 SUCCESS: All systems operational! Ready for Phase 5 (Express API)
```

---

## 📝 Notes

1. **Testing is NON-DESTRUCTIVE**: No transactions are executed, only read operations
2. **Safe to run multiple times**: Each test is independent
3. **Verbose logging**: Each step shows detailed progress for debugging
4. **State inspection**: Final state object contains all intermediate results

---

**Ready to test? Run:**
```bash
cd agents
npm run test:all
```
