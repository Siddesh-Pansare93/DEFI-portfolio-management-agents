import { ethers } from 'ethers';
import { config } from '../utils/config';
import { retry } from '../utils/retry';

// ============================================================================
// ERC20 ABI - Only the functions we need
// ============================================================================

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// ============================================================================
// PROVIDER INITIALIZATION
// ============================================================================

// Initialize Ethereum provider for Sepolia
const provider = new ethers.JsonRpcProvider(config.sepoliaRpcUrl);

// ============================================================================
// BALANCE READING FUNCTIONS
// ============================================================================

/**
 * Get ETH balance for a wallet address
 *
 * @param walletAddress - Ethereum address to query
 * @returns Balance in ETH (decimal format, e.g., 1.5)
 *
 * @example
 * const balance = await getEthBalance('0x1234...');
 * console.log(`Balance: ${balance} ETH`);
 */
export async function getEthBalance(walletAddress: string): Promise<number> {
  return retry(async () => {
    console.log(`📊 Fetching ETH balance for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);

    const balance = await provider.getBalance(walletAddress);
    const balanceInEth = parseFloat(ethers.formatEther(balance));

    console.log(`✅ ETH Balance: ${balanceInEth} ETH`);
    return balanceInEth;
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Get ERC20 token balance for a wallet address
 *
 * @param walletAddress - Ethereum address to query
 * @param tokenAddress - ERC20 token contract address
 * @returns Balance adjusted for token decimals
 *
 * @example
 * const usdcBalance = await getErc20Balance(
 *   '0x1234...',
 *   '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // USDC on Sepolia
 * );
 */
export async function getErc20Balance(
  walletAddress: string,
  tokenAddress: string
): Promise<number> {
  return retry(async () => {
    console.log(`📊 Fetching ERC20 balance for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);

    // Create contract instance
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Fetch balance and decimals in parallel for efficiency
    const [balance, decimals, symbol] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals(),
      contract.symbol().catch(() => 'UNKNOWN') // Symbol might fail for some tokens
    ]);

    // Format balance according to token decimals
    const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));

    console.log(`✅ ${symbol} Balance: ${formattedBalance} ${symbol}`);
    return formattedBalance;
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Get balances for multiple tokens in a single call
 * Useful for fetching entire portfolio at once
 *
 * @param walletAddress - Ethereum address to query
 * @param tokenAddresses - Array of ERC20 token contract addresses
 * @returns Map of token address to balance
 */
export async function getMultipleTokenBalances(
  walletAddress: string,
  tokenAddresses: string[]
): Promise<Map<string, number>> {
  console.log(`📊 Fetching balances for ${tokenAddresses.length} tokens...`);

  // Fetch all balances in parallel
  const balancePromises = tokenAddresses.map(async (tokenAddress) => {
    const balance = await getErc20Balance(walletAddress, tokenAddress);
    return { address: tokenAddress, balance };
  });

  const results = await Promise.all(balancePromises);

  // Convert to Map for easy lookup
  const balanceMap = new Map<string, number>();
  results.forEach(({ address, balance }) => {
    balanceMap.set(address, balance);
  });

  return balanceMap;
}

/**
 * Get token metadata (name, symbol, decimals)
 *
 * @param tokenAddress - ERC20 token contract address
 * @returns Token metadata
 */
export async function getTokenMetadata(tokenAddress: string): Promise<{
  name: string;
  symbol: string;
  decimals: number;
}> {
  return retry(async () => {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [name, symbol, decimals] = await Promise.all([
      contract.name().catch(() => 'Unknown Token'),
      contract.symbol().catch(() => 'UNKNOWN'),
      contract.decimals()
    ]);

    return { name, symbol, decimals };
  }, config.apiRetries, config.retryBackoff);
}

/**
 * Check if an address has any balance (ETH or specific token)
 * Useful for validating user has funds before analysis
 *
 * @param walletAddress - Ethereum address to query
 * @param tokenAddress - Optional ERC20 token address (checks ETH if not provided)
 * @returns true if balance > 0
 */
export async function hasBalance(
  walletAddress: string,
  tokenAddress?: string
): Promise<boolean> {
  try {
    if (tokenAddress) {
      const balance = await getErc20Balance(walletAddress, tokenAddress);
      return balance > 0;
    } else {
      const balance = await getEthBalance(walletAddress);
      return balance > 0;
    }
  } catch (error) {
    console.error('Error checking balance:', error);
    return false;
  }
}
