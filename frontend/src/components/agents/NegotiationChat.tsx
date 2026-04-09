'use client';

import React, { useEffect, useRef } from 'react';
import { Lightbulb, Shield, Scale } from 'lucide-react';

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

const agentConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  'Strategy Proposer': {
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  'Risk Validator': {
    icon: <Shield className="w-4 h-4 text-red-400" />,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  'Nash Negotiator': {
    icon: <Scale className="w-4 h-4 text-violet-400" />,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
};

function getAgentStyle(from: string) {
  // Match loosely in case the name varies slightly
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
    <div className="bg-[#222735] border border-[#334155] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#334155] flex items-center justify-between">
        <span className="font-semibold text-sm text-white">Negotiation Log</span>
        {isLive && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Message area */}
      <div ref={scrollRef} className="max-h-[500px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm text-[#64748B]">Awaiting negotiation...</span>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const style = getAgentStyle(msg.from);

            if (isNashNegotiator(msg.from)) {
              return (
                <div
                  key={idx}
                  className="bg-[#272F42] rounded-xl p-4 border border-violet-500/20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-400/10">
                      <Scale className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-violet-400">
                        {msg.from}
                      </span>
                      <span className="text-xs text-[#64748B]">Round {msg.round}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#94A3B8] mt-1">{msg.content}</p>
                  {msg.keyPoints && msg.keyPoints.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.keyPoints.map((point, i) => (
                        <span
                          key={i}
                          className="bg-[#1E2433] text-xs text-[#94A3B8] px-2 py-0.5 rounded"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={idx} className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}
                >
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${style.color}`}>{msg.from}</span>
                    <span className="text-xs text-[#64748B]">Round {msg.round}</span>
                  </div>
                  <p className="text-sm text-[#94A3B8] mt-1">{msg.content}</p>
                  {msg.keyPoints && msg.keyPoints.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.keyPoints.map((point, i) => (
                        <span
                          key={i}
                          className="bg-[#272F42] text-xs text-[#94A3B8] px-2 py-0.5 rounded"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
