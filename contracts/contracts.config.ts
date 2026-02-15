
// ============================================
// DEPLOYED CONTRACTS & PROTOCOL ADDRESSES
// ============================================

// Your deployed contracts
export const CONTRACTS = {
  SEPOLIA: {
    REBALANCE_LOGGER: '0x4F3DD9522c2d1B240365516a46250226e4eB7B3B',
  }
};

// Uniswap V3 Protocol Addresses on Sepolia
export const UNISWAP_V3_SEPOLIA = {
  // Core contracts
  FACTORY: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
  ROUTER: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  QUOTER_V2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
  NFT_POSITION_MANAGER: '0x1238536071E1c677A632429e3655c799b22cDA52',
  
  // Commonly used pools (for reference)
  POOLS: {
    ETH_USDC_500: '0x6Ce0896eAE38c4fd7aC73dE49B5B40ce7a1d3bB7',  // 0.05% fee
    ETH_USDC_3000: '0x...', // 0.3% fee - add if you find the address
  }
};

// Token Addresses on Sepolia
export const TOKENS_SEPOLIA = {
  // Wrapped ETH
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  
  // Stablecoins
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
  DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
  
  // Other
  WBTC: '0x29f2D40B0605204364af54EC677bD022dA425d03',
  LINK: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
};

// Aave V3 Protocol Addresses on Sepolia (if needed later)
export const AAVE_V3_SEPOLIA = {
  POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
  POOL_DATA_PROVIDER: '0x3e9708d80f7B3e43118013075F7e95CE3AB31F31',
};

// RPC URLs (for backend/frontend)
export const RPC_URLS = {
  SEPOLIA: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
};

// Chain IDs
export const CHAIN_IDS = {
  SEPOLIA: 11155111,
  MAINNET: 1,
};

// External APIs
export const API_ENDPOINTS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  UNISWAP_SUBGRAPH: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-sepolia',
};
