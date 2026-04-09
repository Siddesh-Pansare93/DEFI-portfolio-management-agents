"use client";

import { NewsItem } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GlowContainer } from "@/components/layout/GlowContainer";
import { Card } from "@/components/ui/card";

interface NewsHeadlinesPanelProps {
  headlines: NewsItem[];
}

export function NewsHeadlinesPanel({ headlines }: NewsHeadlinesPanelProps) {
  if (!headlines || headlines.length === 0) {
    return (
      <Card className="p-6 bg-black/40 border-white/10 backdrop-blur-md h-full flex items-center justify-center">
        <p className="text-zinc-500 text-sm font-mono">No recent headlines available.</p>
      </Card>
    );
  }

  const getSentimentIcon = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-neon-green" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-neon-orange" />;
      default: return <Minus className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getSentimentColor = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return "text-neon-green border-neon-green/30 bg-neon-green/5";
      case 'bearish': return "text-neon-orange border-neon-orange/30 bg-neon-orange/5";
      default: return "text-zinc-400 border-zinc-700 bg-zinc-800/50";
    }
  };

  return (
    <GlowContainer glowColor="cyan" intensity="medium" className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 border-b border-neon-cyan/20 pb-4">
        <Newspaper className="w-6 h-6 text-neon-cyan" />
        <h3 className="font-orbitron text-xl text-white tracking-wider">Market Intelligence Feed</h3>
        <span className="ml-auto text-xs font-mono text-neon-cyan/70 bg-neon-cyan/10 px-2 py-1 rounded border border-neon-cyan/20">
          LIVE
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {headlines.map((news, idx) => (
          <div 
            key={idx} 
            className="group relative p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 transition-all duration-300"
          >
            <div className="flex justify-between items-start gap-4 mb-2">
              <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors line-clamp-2">
                {news.title}
              </h4>
              <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${getSentimentColor(news.sentiment)}`}>
                {getSentimentIcon(news.sentiment)}
                {news.sentiment}
              </div>
            </div>
            
            <p className="text-xs text-zinc-500 mb-3 line-clamp-3 leading-relaxed">
              {news.description}
            </p>
            
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600">
              <div className="flex items-center gap-2">
                <span className="text-neon-cyan/70">{news.source}</span>
                <span>•</span>
                <span>{news.publishedAt ? formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true }) : 'Recently'}</span>
              </div>
              
              <a 
                href={news.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-500 hover:text-neon-cyan transition-colors"
              >
                Read <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </GlowContainer>
  );
}
