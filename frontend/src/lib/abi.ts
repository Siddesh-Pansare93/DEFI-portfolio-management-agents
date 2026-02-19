export const REBALANCE_LOGGER_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "action", "type": "string" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "logRebalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const REBALANCE_LOGGER_ADDRESS = "0x1234567890123456789012345678901234567890"; // Placeholder
