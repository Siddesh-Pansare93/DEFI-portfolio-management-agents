"use client";

import { useEffect, useRef } from "react";
import { NegotiationMessage, JobStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Shield, Scale, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NegotiationChatProps {
  messages: NegotiationMessage[];
  status: JobStatus;
}

export function NegotiationChat({ messages, status }: NegotiationChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 font-mono border border-white/10 rounded-xl bg-black/40 backdrop-blur-sm">
        <Terminal className="w-12 h-12 mb-4 opacity-50" />
        <p>AWAITING NEGOTIATION PROTOCOL...</p>
        {status === "analyzing" && (
          <span className="text-xs text-neon-cyan animate-pulse mt-2">
            [AGENTS INITIALIZING HANDSHAKE]
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-black/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neon-cyan" />
          <h2 className="font-orbitron font-bold text-sm tracking-wider text-white">
            NEGOTIATION LOG
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs font-mono text-neon-green">LIVE FEED</span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        <AnimatePresence>
          {messages.map((msg, index) => (
            <MessageBubble key={`${msg.round}-${index}`} message={msg} />
          ))}
        </AnimatePresence>
        
        {status === "analyzing" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-4"
          >
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: NegotiationMessage }) {
  const isStrategy = message.from === "StrategyProposer";
  const isRisk = message.from === "RiskValidator";
  const isNash = message.from === "NashNegotiator";

  const variants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1 },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex gap-4 max-w-4xl mx-auto",
        isNash ? "justify-center w-full" : "justify-start"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        {isStrategy && (
          <div className="w-10 h-10 rounded-lg bg-neon-blue/20 border border-neon-blue/50 flex items-center justify-center shadow-[0_0_10px_rgba(0,100,255,0.3)]">
            <Brain className="w-6 h-6 text-neon-blue" />
          </div>
        )}
        {isRisk && (
          <div className="w-10 h-10 rounded-lg bg-neon-orange/20 border border-neon-orange/50 flex items-center justify-center shadow-[0_0_10px_rgba(255,100,0,0.3)]">
            <Shield className="w-6 h-6 text-neon-orange" />
          </div>
        )}
        {isNash && (
          <div className="w-12 h-12 rounded-full bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center shadow-[0_0_15px_rgba(170,0,255,0.4)] relative">
            <Scale className="w-7 h-7 text-neon-purple" />
            <div className="absolute inset-0 rounded-full border border-neon-purple/30 animate-ping opacity-20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 rounded-2xl p-4 border relative overflow-hidden group hover:border-opacity-100 transition-colors duration-300",
        isStrategy && "bg-neon-blue/5 border-neon-blue/20 text-blue-100 rounded-tl-none",
        isRisk && "bg-neon-orange/5 border-neon-orange/20 text-orange-100 rounded-tl-none",
        isNash && "bg-neon-purple/5 border-neon-purple/20 text-purple-100 text-center shadow-lg"
      )}>
        {/* Glow Effect */}
        <div className={cn(
          "absolute -right-10 -top-10 w-20 h-20 rounded-full blur-[40px] opacity-20",
          isStrategy && "bg-neon-blue",
          isRisk && "bg-neon-orange",
          isNash && "bg-neon-purple"
        )} />

        {/* Header */}
        <div className={cn(
          "flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-widest opacity-70",
          isNash && "justify-center"
        )}>
          <span>{message.from.replace(/([A-Z])/g, ' $1').trim()}</span>
          <span className="w-1 h-1 rounded-full bg-current opacity-50" />
          <span>Round {message.round}</span>
          <span className="w-1 h-1 rounded-full bg-current opacity-50" />
          <span>{message.type.replace(/_/g, ' ')}</span>
        </div>

        {/* Body */}
        <div className="font-light leading-relaxed whitespace-pre-wrap relative z-10">
          {message.content}
        </div>

        {/* Key Points / List */}
        {message.keyPoints && message.keyPoints.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
            {message.keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm opacity-90">
                {isRisk ? (
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-neon-orange shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-neon-green shrink-0" />
                )}
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
