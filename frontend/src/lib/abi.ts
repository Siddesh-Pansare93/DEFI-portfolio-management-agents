export const REBALANCE_LOGGER_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "action", "type": "string" },
      { "internalType": "string", "name": "details", "type": "string" }
    ],
    "name": "logRecommendation",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "recommendationIndex", "type": "uint256" }
    ],
    "name": "markAsExecuted",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "action", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "details", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "recommendationIndex", "type": "uint256" }
    ],
    "name": "RecommendationLogged",
    "type": "event"
  }
] as const;

// Deployed contract on Sepolia
export const REBALANCE_LOGGER_ADDRESS = "0x4F3DD9522c2d1B240365516a46250226e4eB7B3B";
