import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RebalanceLoggerModule = buildModule("RebalanceLoggerModule", (m) => {
  // Deploy RebalanceLogger contract (not Counter!)
  const rebalanceLogger = m.contract("RebalanceLogger");
  
  return { rebalanceLogger };
});

export default RebalanceLoggerModule;