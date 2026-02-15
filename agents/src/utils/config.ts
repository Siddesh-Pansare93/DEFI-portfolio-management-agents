import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================================

const requiredEnvVars = [
  'GOOGLE_API_KEY',
  'SEPOLIA_RPC_URL',
  'REBALANCE_LOGGER_ADDRESS',
  'COINGECKO_API_URL'
];

// Validate that all required environment variables are set
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// ============================================================================
// CONFIGURATION OBJECT
// ============================================================================

export const config = {
  // ============== Google Gemini Configuration ==============
  googleApiKey: process.env.GOOGLE_API_KEY!,
  geminiModel: 'gemini-1.5-pro',
  geminiTemperature: 0.1,        // Low temperature for consistency

  // ============== Blockchain Configuration ==============
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL!,
  chainId: 11155111,              // Sepolia testnet chain ID

  // ============== Smart Contract Addresses ==============
  rebalanceLoggerAddress: process.env.REBALANCE_LOGGER_ADDRESS!,

  // Token addresses on Sepolia
  wethAddress: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  usdtAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
  daiAddress: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',

  // Uniswap V3 protocol addresses on Sepolia
  uniswapFactory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
  uniswapRouter: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  uniswapQuoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
  uniswapNFTPositionManager: '0x1238536071E1c677A632429e3655c799b22cDA52',

  // Uniswap V3 pools
  uniswapPoolAddress: '0x6Ce0896eAE38c4fd7aC73dE49B5B40ce7a1d3bB7', // ETH-USDC 0.05% fee tier

  // ============== External API Configuration ==============
  coingeckoApiUrl: process.env.COINGECKO_API_URL!,
  theGraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-sepolia',

  // ============== Server Configuration ==============
  port: parseInt(process.env.PORT || '3001', 10),

  // ============== Risk Parameters ==============
  riskLimits: {
    maxImpermanentLoss: 0.10,     // 10% maximum IL
    maxSinglePosition: 0.70,      // 70% maximum single position size
    minDiversification: 2,        // At least 2 assets
    maxVolatilityThreshold: 0.50  // 50% annualized volatility threshold
  },

  // ============== Workflow Settings ==============
  workflowTimeout: 120000,        // 2 minutes (in milliseconds)
  jobRetentionTime: 1800000,      // 30 minutes (in milliseconds)

  // ============== API Settings ==============
  apiRetries: 3,                  // Number of retry attempts for API calls
  retryBackoff: 1000,             // Base delay in ms for exponential backoff
  cacheTimeout: 300000,           // 5 minutes cache TTL (in milliseconds)

  // ============== Token Symbols for CoinGecko ==============
  tokenSymbols: {
    ETH: 'ethereum',
    USDC: 'usd-coin',
    USDT: 'tether',
    DAI: 'dai',
    WBTC: 'wrapped-bitcoin'
  },

  // ============== Uniswap V3 Constants ==============
  uniswapV3: {
    feeTiers: {
      LOW: 500,                   // 0.05%
      MEDIUM: 3000,               // 0.3%
      HIGH: 10000                 // 1%
    },
    tickSpacing: {
      500: 10,
      3000: 60,
      10000: 200
    }
  },

  // ============== Agent Configuration ==============
  agents: {
    dataCollector: {
      name: 'Data Collection Agent',
      timeout: 30000              // 30 seconds
    },
    marketAnalyzer: {
      name: 'Market Analyzer Agent',
      timeout: 30000              // 30 seconds
    },
    strategyProposer: {
      name: 'Strategy Proposer Agent',
      timeout: 30000              // 30 seconds
    },
    riskValidator: {
      name: 'Risk Validator Agent',
      timeout: 30000              // 30 seconds
    }
  }
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get CoinGecko symbol for a token
 */
export function getCoinGeckoSymbol(token: string): string {
  const symbols = config.tokenSymbols as Record<string, string>;
  return symbols[token.toUpperCase()] || token.toLowerCase();
}

/**
 * Get tick spacing for a fee tier
 */
export function getTickSpacing(feeTier: number): number {
  const spacing = config.uniswapV3.tickSpacing as Record<number, number>;
  return spacing[feeTier] || 60; // Default to medium fee tier spacing
}

/**
 * Validate configuration on module load
 */
export function validateConfig(): void {
  // Validate port
  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port number: ${config.port}`);
  }

  // Validate risk limits
  if (config.riskLimits.maxImpermanentLoss <= 0 || config.riskLimits.maxImpermanentLoss > 1) {
    throw new Error('maxImpermanentLoss must be between 0 and 1');
  }

  if (config.riskLimits.maxSinglePosition <= 0 || config.riskLimits.maxSinglePosition > 1) {
    throw new Error('maxSinglePosition must be between 0 and 1');
  }

  // Validate timeouts
  if (config.workflowTimeout < 10000) {
    throw new Error('workflowTimeout must be at least 10 seconds');
  }

  console.log('✅ Configuration validated successfully');
}

// Validate configuration when module is loaded
validateConfig();
