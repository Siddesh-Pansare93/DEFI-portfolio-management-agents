"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Brain, Zap, Shield, Sparkles, Activity } from "lucide-react";
// Dashboard redirect — analysis starts from dashboard, not landing page
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Animated Neural Constellation (Canvas) ─────────────────────────────────
function NeuralConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Neural nodes — representing the 5 agents
    const agentColors = ["#06B6D4", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6"];

    interface Node {
      x: number; y: number; vx: number; vy: number;
      radius: number; color: string; pulse: number; pulseSpeed: number;
    }

    const nodes: Node[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }[] = [];

    // Create main agent nodes
    for (let i = 0; i < 5; i++) {
      nodes.push({
        x: width * (0.2 + Math.random() * 0.6),
        y: height * (0.15 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 3 + Math.random() * 2,
        color: agentColors[i],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      });
    }

    // Create ambient floating particles
    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 0.5 + Math.random() * 1,
        color: agentColors[Math.floor(Math.random() * agentColors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.01,
      });
    }

    function drawNode(node: Node, index: number) {
      if (!ctx) return;
      node.pulse += node.pulseSpeed;
      const pulseScale = 1 + Math.sin(node.pulse) * 0.3;
      const isAgent = index < 5;
      const r = node.radius * pulseScale;

      // Glow
      if (isAgent) {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 12);
        gradient.addColorStop(0, node.color + "30");
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 12, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isAgent ? node.color : node.color + "40";
      ctx.fill();
    }

    function drawConnections() {
      if (!ctx) return;
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 400) {
            const opacity = (1 - dist / 400) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Ambient particle connections
      for (let i = 5; i < nodes.length; i++) {
        for (let j = 0; j < 5; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 200) {
            const opacity = (1 - dist / 200) * 0.06;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }
    }

    // Traveling data particles along connections
    function spawnTravelParticle() {
      if (Math.random() > 0.03) return;
      const fromIdx = Math.floor(Math.random() * 5);
      let toIdx = Math.floor(Math.random() * 5);
      if (toIdx === fromIdx) toIdx = (toIdx + 1) % 5;
      const from = nodes[fromIdx], to = nodes[toIdx];
      const speed = 0.008 + Math.random() * 0.006;
      particles.push({
        x: from.x, y: from.y,
        vx: (to.x - from.x) * speed,
        vy: (to.y - from.y) * speed,
        life: 0, maxLife: 1 / speed,
        color: from.color,
      });
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Move nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      });

      drawConnections();
      nodes.forEach((node, i) => drawNode(node, i));

      // Traveling particles
      spawnTravelParticle();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const progress = p.life / p.maxLife;
        if (progress >= 1) { particles.splice(i, 1); continue; }
        const alpha = Math.sin(progress * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(alpha * 200).toString(16).padStart(2, "0");
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "transparent" }}
    />
  );
}

// ─── Floating Orb Component ──────────────────────────────────────────────────
function FloatingOrb({ color, size, x, y, delay }: { color: string; size: string; x: string; y: string; delay: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, delay: parseFloat(delay) }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle at 30% 30%, ${color}15, ${color}08, transparent 70%)`,
        filter: "blur(60px)",
      }}
    />
  );
}

// ─── Stats Ticker ────────────────────────────────────────────────────────────
function StatsTicker() {
  const stats = [
    { label: "AI AGENTS", value: "5" },
    { label: "NEGOTIATION ROUNDS", value: "8" },
    { label: "TOKENS ANALYZED", value: "25" },
    { label: "ON-CHAIN EXECUTION", value: "LIVE" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1.2 }}
      className="flex items-center justify-center gap-8 md:gap-12 mt-12"
    >
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="font-mono text-lg md:text-xl font-bold text-white/90">{stat.value}</span>
          <span className="text-[10px] tracking-[0.15em] text-white/30 uppercase mt-0.5">{stat.label}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export default function Home() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const validateAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!address) return;
    if (!validateAddress(address)) {
      setError("Invalid Ethereum address format");
      return;
    }
    setIsLoading(true);
    // Navigate to dashboard — analysis starts from there
    router.push(`/dashboard?wallet=${address}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303]">
      {/* ── Neural constellation background ── */}
      <NeuralConstellation />

      {/* ── Atmospheric orbs ── */}
      <FloatingOrb color="#8B5CF6" size="800px" x="-10%" y="-20%" delay="0" />
      <FloatingOrb color="#6366F1" size="600px" x="60%" y="50%" delay="0.3" />
      <FloatingOrb color="#06B6D4" size="500px" x="70%" y="-10%" delay="0.6" />
      <FloatingOrb color="#F59E0B" size="300px" x="10%" y="70%" delay="0.9" />

      {/* ── Gradient beams (inspired by 21st.dev Hero1) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="flex gap-[12rem] rotate-[-25deg] absolute top-[-45rem] right-[-35rem] z-[0] blur-[5rem] opacity-20">
          <div className="w-[8rem] h-[25rem] bg-gradient-to-b from-violet-500 to-transparent" />
          <div className="w-[6rem] h-[20rem] bg-gradient-to-b from-indigo-500 to-transparent" />
          <div className="w-[10rem] h-[30rem] bg-gradient-to-b from-violet-600 to-transparent" />
        </div>
      </div>

      {/* ── Subtle grid (fades radially) ── */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 30%, transparent 70%)",
        }}
      />

      <NavBar />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-20">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[13px] tracking-wide text-white/50">
              Multi-Agent Neural Intelligence
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-center leading-[0.95] tracking-[-0.04em] mb-5"
        >
          <span className="block text-[clamp(3.5rem,8vw,7rem)] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
            Autonomous
          </span>
          <span className="block text-[clamp(3.5rem,8vw,7rem)] font-bold text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-violet-400 to-indigo-400">
            DeFi
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-white/40 text-lg md:text-xl max-w-lg mb-10 tracking-tight"
        >
          AI agents that <span className="text-white/70">think</span>,{" "}
          <span className="text-white/70">debate</span>, and{" "}
          <span className="text-violet-400/80">execute</span> your DeFi strategies
        </motion.p>

        {/* ── Wallet Input ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg relative"
        >
          <div
            className={cn(
              "relative rounded-2xl transition-all duration-500",
              isFocused
                ? "shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                : "shadow-[0_0_20px_rgba(0,0,0,0.3)]"
            )}
          >
            {/* Animated border gradient */}
            <div
              className={cn(
                "absolute -inset-[1px] rounded-2xl transition-opacity duration-500",
                isFocused ? "opacity-100" : "opacity-0"
              )}
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.2), rgba(6,182,212,0.3))",
              }}
            />

            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2 bg-[#0A0A0F]/90 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-1.5"
            >
              <Input
                placeholder="Enter wallet address (0x...)"
                className="h-12 bg-transparent border-none text-white/90 placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm pl-4"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (error) setError(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !address}
                className={cn(
                  "relative bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl px-6 h-10 transition-all duration-300 shrink-0",
                  "shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]",
                  "active:scale-[0.97]",
                  isLoading && "opacity-50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Analyze
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute -bottom-9 left-0 right-0 text-center"
              >
                <span className="text-red-400 text-xs">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo wallet link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-4"
          >
            <button
              type="button"
              className="text-[13px] text-white/25 hover:text-white/50 transition-colors duration-300 cursor-pointer"
              onClick={() => {
                setAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4");
                setError(null);
              }}
            >
              or try with a demo wallet →
            </button>
          </motion.div>
        </motion.div>

        {/* ── Stats ── */}
        <StatsTicker />

        {/* ── Feature Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mt-16 px-4"
        >
          {[
            {
              icon: Brain,
              title: "Neural Agents",
              desc: "5 specialized AI agents analyze markets, propose strategies, and validate risks through multi-round debate",
              color: "#8B5CF6",
            },
            {
              icon: Activity,
              title: "Live Execution",
              desc: "Watch agents think in real-time. Strategies executed on-chain via smart contract on Ethereum Sepolia",
              color: "#06B6D4",
            },
            {
              icon: Shield,
              title: "Nash Equilibrium",
              desc: "Game-theory powered negotiation ensures optimal balance between yield and safety before any action",
              color: "#22C55E",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-2xl p-[1px] overflow-hidden"
            >
              {/* Hover border glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${card.color}30, transparent 60%)`,
                }}
              />

              <div className="relative bg-[#0A0A0F]/80 backdrop-blur-xl rounded-2xl border border-white/[0.05] p-6 h-full transition-all duration-300 group-hover:bg-[#0F0F18]/80">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}12` }}
                >
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>

                <h3 className="text-white/90 font-semibold text-[15px] mb-2 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-white/30 text-[13px] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Bottom fade gradient ── */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none z-20" />
      </div>
    </main>
  );
}
