'use client';

import React, { useEffect, useRef } from 'react';
import { Lightbulb, Shield, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingText } from './TypingText';

interface NegotiationMessage {
  round: number;
  from: string;
  type: string;
  content: string;
  keyPoints: string[];
  timestamp: Date;
}

interface NegotiationChatProps {
  messages: NegotiationMessage[];
  status?: string;
}

const agentConfig: Record<string, { icon: React.ReactNode; colorHex: string; colorClass: string }> = {
  'Strategy Proposer': {
    icon: <Lightbulb className="w-4 h-4 text-white" />,
    colorHex: '#F59E0B',
    colorClass: 'text-amber-500',
  },
  'Risk Validator': {
    icon: <Shield className="w-4 h-4 text-white" />,
    colorHex: '#EF4444',
    colorClass: 'text-red-500',
  },
  'Nash Negotiator': {
    icon: <Scale className="w-4 h-4 text-white" />,
    colorHex: '#8B5CF6',
    colorClass: 'text-violet-500',
  },
};

function getAgentStyle(from: string) {
  const key = Object.keys(agentConfig).find((k) =>
    from.toLowerCase().includes(k.toLowerCase().split(' ')[0].toLowerCase())
  );
  return key ? agentConfig[key] : agentConfig['Strategy Proposer'];
}

function isNashNegotiator(from: string) {
  return from.toLowerCase().includes('nash') || from.toLowerCase().includes('negotiator');
}

export default function NegotiationChat({ messages, status }: NegotiationChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLive = status === 'analyzing';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="glass-card overflow-hidden w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[rgba(255,255,255,0.01)]">
        <span className="font-semibold text-sm text-[#EDEDEF] tracking-wide">Agent Negotiation</span>
        {isLive && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">Live</span>
          </div>
        )}
      </div>

      {/* Message area */}
      <div ref={scrollRef} className="max-h-[500px] overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm text-[#4A4F5A]">Awaiting negotiation...</span>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const style = getAgentStyle(msg.from);
              const isNash = isNashNegotiator(msg.from);

              if (isNash) {
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-violet-500/5 rounded-2xl p-6 border border-violet-500/15 w-full flex flex-col items-center text-center mt-8"
                  >
                    <div className="text-violet-500 text-xs uppercase tracking-[0.2em] font-bold mb-4">
                      Final Decision
                    </div>
                    
                    <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
                      <div 
                        className="absolute inset-0 rounded-full blur-[10px] opacity-50"
                        style={{ backgroundColor: style.colorHex }}
                      />
                      <div 
                        className="relative z-10 w-full h-full rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                        style={{ background: `radial-gradient(circle at center, ${style.colorHex} 0%, transparent 80%)`, backgroundColor: '#0A0A0F' }}
                      >
                        {style.icon}
                      </div>
                    </div>
                    
                    <p className="text-base text-[#EDEDEF] mb-4 leading-relaxed max-w-2xl">
                      <TypingText text={msg.content} />
                    </p>
                    
                    {msg.keyPoints && msg.keyPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {msg.keyPoints.map((point, i) => (
                          <span
                            key={i}
                            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-xs text-[#EDEDEF] px-3 py-1 rounded-lg"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="relative w-8 h-8 shrink-0 flex items-center justify-center mt-1">
                    <div 
                      className="absolute inset-0 rounded-full blur-[8px] opacity-40"
                      style={{ backgroundColor: style.colorHex }}
                    />
                    <div 
                      className="relative z-10 w-full h-full rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.1)]"
                      style={{ background: `radial-gradient(circle at center, ${style.colorHex} 0%, transparent 80%)`, backgroundColor: '#0A0A0F' }}
                    >
                      {React.cloneElement(style.icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5" })}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${style.colorClass}`}>{msg.from}</span>
                      <span className="bg-[rgba(255,255,255,0.04)] text-[#8A8F98] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Round {msg.round}
                      </span>
                    </div>
                    <div className="text-sm text-[#8A8F98] leading-relaxed">
                      <TypingText text={msg.content} />
                    </div>
                    {msg.keyPoints && msg.keyPoints.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.keyPoints.map((point, i) => (
                          <span
                            key={i}
                            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-xs text-[#8A8F98] px-2.5 py-1 rounded-lg"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}