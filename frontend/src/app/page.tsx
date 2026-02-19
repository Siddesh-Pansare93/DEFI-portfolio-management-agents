import { NavBar } from "@/components/layout/NavBar";
import { GlowContainer } from "@/components/layout/GlowContainer";
import { NeonBadge } from "@/components/shared/NeonBadge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
      <NavBar />
      
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col gap-12">
        <GlowContainer glowColor="cyan" intensity="high" className="p-12 text-center bg-black/40 backdrop-blur-xl border border-neon-cyan/20 w-full">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple animate-pulse">
            AUTONOMOUS DEFI
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto font-sans">
            Multi-Agent Intelligence for Optimal Liquidity Management
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <NeonBadge label="PHASE 1 COMPLETE" color="green" size="lg" />
            <NeonBadge label="CYBERPUNK THEME ACTIVE" color="cyan" size="lg" />
          </div>
        </GlowContainer>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <GlowContainer glowColor="blue" intensity="medium" className="h-48 flex items-center justify-center flex-col gap-4">
            <span className="text-neon-blue font-orbitron text-xl">MARKET ANALYSIS</span>
            <div className="w-16 h-1 bg-neon-blue shadow-[0_0_10px_#4488ff]" />
          </GlowContainer>
          
          <GlowContainer glowColor="yellow" intensity="medium" className="h-48 flex items-center justify-center flex-col gap-4">
            <span className="text-neon-yellow font-orbitron text-xl">STRATEGY GEN</span>
            <div className="w-16 h-1 bg-neon-yellow shadow-[0_0_10px_#ffee00]" />
          </GlowContainer>
          
          <GlowContainer glowColor="purple" intensity="medium" className="h-48 flex items-center justify-center flex-col gap-4">
            <span className="text-neon-purple font-orbitron text-xl">NASH OPTIMIZER</span>
            <div className="w-16 h-1 bg-neon-purple shadow-[0_0_10px_#aa00ff]" />
          </GlowContainer>
        </div>
      </div>
    </main>
  );
}
