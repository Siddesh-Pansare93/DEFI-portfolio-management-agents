import hre from 'hardhat';
import '@nomicfoundation/hardhat-toolbox-viem';

async function main() {
  console.log('Testing RebalanceLogger Contract on Sepolia\n');
  
  const contractAddress = '0x4F3DD9522c2d1B240365516a46250226e4eB7B3B';
  
  const publicClient = await hre.viem.getPublicClient();
  const walletClients = await hre.viem.getWalletClients();
  const signer = walletClients[0];
  
  console.log('Contract:', contractAddress);
  console.log('Your Address:', signer.account.address);
  
  const logger = await hre.viem.getContractAt(
    'RebalanceLogger',
    contractAddress as `0x${string}`
  );
  
  console.log('\nChecking recommendation count...');
  const count = await logger.read.getRecommendationCount([
    signer.account.address
  ]);
  console.log('Current count:', count.toString());
  
  console.log('\nLogging new recommendation...');
  const data = {
    action: 'add_liquidity',
    pool: 'ETH-USDC',
    ethAmount: '0.1',
    usdcAmount: '200'
  };
  
  const hash = await logger.write.logRecommendation([
    'add_liquidity',
    JSON.stringify(data)
  ]);
  
  console.log('Transaction:', hash);
  console.log('Etherscan: https://sepolia.etherscan.io/tx/' + hash);
  
  console.log('\nWaiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Confirmed in block:', receipt.blockNumber.toString());
  
  const newCount = await logger.read.getRecommendationCount([
    signer.account.address
  ]);
  console.log('\nNew count:', newCount.toString());
  
  if (newCount > 0n) {
    const latest = await logger.read.getLatestRecommendation([
      signer.account.address
    ]);
    console.log('\nLatest recommendation:');
    console.log('  Action:', latest.action);
    console.log('  Details:', latest.details);
  }
  
  console.log('\nTest complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });