"use client";

interface TechnicalIndicator {
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  bollingerBands?: { upper: number; middle: number; lower: number };
  ema?: { ema12: number; ema26: number; ema50?: number };
  tradingSignal?: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
}

interface TechnicalIndicatorsCardProps {
  data: TechnicalIndicator | null;
}

const signalStyles: Record<string, string> = {
  strong_buy: "bg-emerald-500/10 text-emerald-400",
  buy: "bg-green-500/10 text-green-400",
  hold: "bg-amber-500/10 text-amber-400",
  sell: "bg-orange-500/10 text-orange-400",
  strong_sell: "bg-red-500/10 text-red-400",
};

export function TechnicalIndicatorsCard({ data }: TechnicalIndicatorsCardProps) {
  if (!data) return null;

  const { rsi, macd, bollingerBands, ema, tradingSignal } = data;

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="uppercase tracking-wider text-[#64748B] text-xs font-semibold">
          Technical Indicators
        </h3>
        {tradingSignal && (
          <span
            className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase ${
              signalStyles[tradingSignal] || signalStyles.hold
            }`}
          >
            {tradingSignal.replace("_", " ")}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* RSI */}
        {rsi != null && (
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-sm">RSI (14)</span>
            <span
              className={`font-mono text-white text-sm font-medium ${
                rsi > 70 ? "text-red-400" : rsi < 30 ? "text-emerald-400" : ""
              }`}
            >
              {rsi.toFixed(1)}
            </span>
          </div>
        )}

        {/* MACD */}
        {macd && (
          <div className="space-y-2">
            <span className="text-[#64748B] text-sm block">MACD</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[#64748B] text-xs block">Value</span>
                <span className="font-mono text-white text-sm">
                  {macd.value.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-xs block">Signal</span>
                <span className="font-mono text-white text-sm">
                  {macd.signal.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-xs block">Histogram</span>
                <span
                  className={`font-mono text-sm font-medium ${
                    macd.histogram >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {macd.histogram.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bollinger Bands */}
        {bollingerBands && (
          <div className="space-y-2">
            <span className="text-[#64748B] text-sm block">Bollinger Bands</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[#64748B] text-xs block">Upper</span>
                <span className="font-mono text-white text-sm">
                  ${bollingerBands.upper.toFixed(0)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-xs block">Middle</span>
                <span className="font-mono text-white text-sm">
                  ${bollingerBands.middle.toFixed(0)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-xs block">Lower</span>
                <span className="font-mono text-white text-sm">
                  ${bollingerBands.lower.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* EMAs */}
        {ema && (
          <div className="space-y-2">
            <span className="text-[#64748B] text-sm block">EMAs</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[#64748B] text-xs block">EMA 12</span>
                <span className="font-mono text-white text-sm">
                  ${ema.ema12.toFixed(0)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-xs block">EMA 26</span>
                <span className="font-mono text-white text-sm">
                  ${ema.ema26.toFixed(0)}
                </span>
              </div>
              {ema.ema50 != null && (
                <div>
                  <span className="text-[#64748B] text-xs block">EMA 50</span>
                  <span className="font-mono text-white text-sm">
                    ${ema.ema50.toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
