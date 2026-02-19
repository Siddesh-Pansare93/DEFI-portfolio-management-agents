'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Wallet, Loader2 } from "lucide-react"

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  if (isConnected && address) {
    return (
      <Button 
        variant="outline" 
        className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 font-mono backdrop-blur-sm"
        onClick={() => disconnect()}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {formatAddress(address)}
      </Button>
    )
  }

  // Find the injected connector or just use the first available one
  const handleConnect = () => {
    const connector = connectors.find(c => c.id === 'injected') || connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  return (
    <Button 
      variant="default"
      className="bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/40 hover:text-white transition-all duration-300 font-orbitron tracking-wide backdrop-blur-sm"
      disabled={isPending}
      onClick={handleConnect}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4 mr-2" />
      )}
      {isPending ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
