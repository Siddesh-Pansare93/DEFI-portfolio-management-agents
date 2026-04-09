"use client";

import { ExternalLink } from "lucide-react";

interface NewsHeadline {
  title: string;
  source: string;
  url?: string;
  sentiment?: "bullish" | "bearish" | "neutral";
  publishedAt?: string;
}

interface NewsHeadlinesPanelProps {
  headlines: NewsHeadline[] | null;
}

const sentimentStyles: Record<string, string> = {
  bullish: "bg-emerald-500/10 text-emerald-400",
  bearish: "bg-red-500/10 text-red-400",
  neutral: "bg-amber-500/10 text-amber-400",
};

export function NewsHeadlinesPanel({ headlines }: NewsHeadlinesPanelProps) {
  if (!headlines || headlines.length === 0) return null;

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl p-6 h-full">
      <h3 className="uppercase tracking-wider text-[#64748B] text-xs font-semibold mb-5">
        News Headlines
      </h3>

      <div className="space-y-3">
        {headlines.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 py-3 border-b border-[#334155] last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white text-sm font-medium hover:text-blue-400 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="line-clamp-2">{item.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : (
                <span className="text-white text-sm font-medium line-clamp-2">
                  {item.title}
                </span>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#64748B] text-xs">{item.source}</span>
                {item.publishedAt && (
                  <span className="text-[#64748B] text-xs">
                    {item.publishedAt}
                  </span>
                )}
              </div>
            </div>

            {item.sentiment && (
              <span
                className={`flex-shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize ${
                  sentimentStyles[item.sentiment] || sentimentStyles.neutral
                }`}
              >
                {item.sentiment}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
