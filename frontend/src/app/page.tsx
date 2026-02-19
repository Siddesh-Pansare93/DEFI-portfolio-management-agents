"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Shield, Zap, Brain, Activity } from "lucide-react";
import { startAnalysis } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Home() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address) return;
    
    if (!validateAddress(address)) {
      setError("Invalid Ethereum address format (0x... + 40 chars)");
      return;
    }

    setIsLoading(true);

    try {
      const data = await startAnalysis(address);
      router.push(`/analyze?wallet=${address}&job=${data.jobId}`);
    } catch (err) {
      console.error("Analysis start failed:", err);
      setError("Failed to start analysis. Is the backend running?");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      <NavBar />
      
      <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-16 pt-20">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-xs font-mono mb-4 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
            </span>
            SYSTEM ONLINE // SEPOLIA NETWORK
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-orbitron tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-neon-cyan to-neon-purple drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            AUTONOMOUS<br/>DEFI INTELLIGENCE
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Deploy a swarm of AI agents to analyze, strategize, and optimize your portfolio in real-time.
          </p>
        </div>

        {/* Wallet Input */}
        <div className="w-full max-w-md relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-blue rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <form onSubmit={handleSubmit} className="relative flex items-center bg-black/80 rounded-lg p-2 border border-white/10 backdrop-blur-xl">
            <Input 
              placeholder="Enter Sepolia Wallet Address (0x...)" 
              className="h-12 bg-transparent border-none text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !address}
              className={cn(
                "h-10 w-10 bg-neon-cyan text-black hover:bg-neon-cyan/90 transition-all shadow-[0_0_10px_rgba(0,255,255,0.3)] shrink-0",
                isLoading && "opacity-50"
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
          
          {error && (
            <div className="absolute -bottom-10 left-0 right-0 text-center">
              <span className="text-red-400 text-xs font-mono bg-red-950/50 px-2 py-1 rounded border border-red-900/50 animate-pulse">
                ! {error}
              </span>
            </div>
          )}
          
          <div className="absolute -bottom-8 right-0 text-xs text-zinc-600 font-mono cursor-pointer hover:text-neon-cyan transition-colors"
               onClick={() => {
                 setAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4");
                 setError(null);
               }}>
            Try Demo Wallet
          </div>
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
      "flex flex-col items-center text-center p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-default",
      colorMap[color as keyof typeof colorMap]
    )}>
      <div className="p-3 rounded-full bg-black/40 mb-4 border border-white/5">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-orbitron font-bold text-lg mb-1 text-white tracking-wide">{title}</h3>
      <p className="text-sm text-muted-foreground font-light">{desc}</p>
    </div>
  );
}
