"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { NavBar } from "@/components/layout/NavBar";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Shield, Zap, Brain, Activity, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if already connected
  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  const handleConnect = () => {
    // Prefer injected (Metamask/Rabby) or fallback to first available
    const connector = connectors.find(c => c.id === 'injected') || connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  if (!isClient) return null; // Or a loading spinner

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-black text-white">
      <NavBar />
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-purple/10 via-black to-black -z-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent opacity-50" />

      <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-16 pt-20">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-xs font-mono mb-4 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
            </span>
            SYSTEM ONLINE // SEPOLIA NETWORK
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-orbitron tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-neon-cyan to-neon-purple drop-shadow-[0_0_15px_rgba(0,255,255,0.3)] leading-tight">
            AUTONOMOUS<br/>DEFI INTELLIGENCE
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Deploy a swarm of AI agents to analyze, strategize, and optimize your portfolio in real-time. Connect your wallet to begin the negotiation.
          </p>
        </div>

        {/* Call to Action */}
        <div className="w-full max-w-md relative group flex justify-center">
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-blue rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          
          <Button 
            onClick={handleConnect}
            disabled={isPending || isConnected}
            className="relative h-16 px-8 bg-black hover:bg-zinc-900 text-white border border-white/10 text-lg font-orbitron tracking-wider uppercase transition-all duration-300 w-full md:w-auto min-w-[200px]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-neon-cyan" />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-neon-green" />
                Redirecting...
              </>
            ) : (
              <>
                <Wallet className="mr-3 h-5 w-5 text-neon-cyan" />
                Connect Wallet
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform text-neon-purple" />
              </>
            )}
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-12 px-4">
          <FeatureCard 
            icon={Activity} 
            title="Real-Time Analysis" 
            desc="Live market data processing" 
            color="cyan" 
          />
          <FeatureCard 
            icon={Brain} 
            title="Multi-Agent AI" 
            desc="5 specialized neural networks" 
            color="purple" 
          />
          <FeatureCard 
            icon={Shield} 
            title="Risk Validation" 
            desc="Automated safety checks" 
            color="orange" 
          />
          <FeatureCard 
            icon={Zap} 
            title="Instant Execution" 
            desc="On-chain strategy deployment" 
            color="yellow" 
          />
        </div>

      </div>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  const colorMap = {
    cyan: "text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5 hover:border-neon-cyan/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]",
    purple: "text-neon-purple border-neon-purple/20 bg-neon-purple/5 hover:border-neon-purple/50 hover:shadow-[0_0_15px_rgba(170,0,255,0.2)]",
    orange: "text-neon-orange border-neon-orange/20 bg-neon-orange/5 hover:border-neon-orange/50 hover:shadow-[0_0_15px_rgba(255,102,0,0.2)]",
    yellow: "text-neon-yellow border-neon-yellow/20 bg-neon-yellow/5 hover:border-neon-yellow/50 hover:shadow-[0_0_15px_rgba(255,238,0,0.2)]",
  };
  
  return (
    <div className={cn(
      "flex flex-col items-center text-center p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-default bg-black/40",
      colorMap[color as keyof typeof colorMap]
    )}>
      <div className="p-3 rounded-full bg-black/40 mb-4 border border-white/5 shadow-inner">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-orbitron font-bold text-lg mb-1 text-white tracking-wide">{title}</h3>
      <p className="text-sm text-zinc-400 font-light font-mono">{desc}</p>
    </div>
  );
}
