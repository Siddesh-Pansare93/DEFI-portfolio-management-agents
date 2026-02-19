# Autonomous DeFi Frontend

A high-performance, cyberpunk-themed visualization dashboard for the Autonomous DeFi multi-agent system. This Next.js application provides real-time insights into the AI pipeline, displaying market analysis, risk assessment, and strategic negotiations as they happen.

## Features

- **Real-time Pipeline Visualization**: Watch as 5 distinct AI agents (Data Collector, Market Analyzer, Strategy Proposer, Risk Validator, Nash Negotiator) process DeFi data sequentially.
- **Interactive Charts**:
  - **Nash Equilibrium Visualization**: A scatter plot representing the negotiation outcome between Profit and Risk agents.
  - **Portfolio Allocation**: Donut charts showing recommended asset distributions.
  - **Risk & Confidence Gauges**: Radial charts displaying the system's confidence levels.
- **Web3 Integration**: Connect your wallet via `wagmi` / `viem` to execute recommended strategies directly on the Sepolia testnet.
- **Cyberpunk UI**: A polished, dark-mode interface built with Tailwind CSS v4, featuring glowing effects and futuristic typography.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Charts**: Recharts
- **Web3**: wagmi, viem, @tanstack/react-query
- **State Management**: React Hooks (Custom hooks for polling and animation)

## Getting Started

### Prerequisites

- Node.js 18+
- The Backend Service running on port `3001` (by default)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

The application currently defaults to connecting to a backend at `http://localhost:3001`. 
The Web3 functionality is configured for the **Sepolia Testnet**.

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the top right to link your MetaMask or other Web3 wallet.
2. **Start Analysis**: Click "Initialize Agents" to trigger the multi-agent pipeline.
3. **Monitor Progress**: Watch the "Agent Pipeline" visualization as each agent completes its task.
4. **Review Results**: Once complete, analyze the "Final Strategy" card and the "Nash Negotiation" chart.
5. **Execute**: Use the "Execute Strategy" button to simulate or run the transaction on-chain.

## License

MIT
