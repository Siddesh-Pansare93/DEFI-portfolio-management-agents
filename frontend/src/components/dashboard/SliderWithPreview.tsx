"use client";

import { Slider } from "@/components/ui/slider";
import { Info, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SliderWithPreviewProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  description: string;
  previewText: string;
  isRiskFactor?: boolean; // Color changes from green -> red as value increases
}

export function SliderWithPreview({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  description,
  previewText,
  isRiskFactor = false,
}: SliderWithPreviewProps) {
  // Calculate color based on percentage (Green -> Yellow -> Red)
  const percentage = (value - min) / (max - min);
  const getColor = () => {
    if (!isRiskFactor) return "bg-neon-blue";
    if (percentage < 0.33) return "bg-neon-green";
    if (percentage < 0.66) return "bg-neon-yellow";
    return "bg-neon-orange"; // Using orange as high risk color
  };

  const colorClass = getColor();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-mono text-zinc-300 font-medium">
            {label}
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs max-w-xs">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm bg-white/5 px-2 py-1 rounded border border-white/5">
          <span className={`font-bold ${colorClass.replace("bg-", "text-")}`}>
            {value}
            {unit}
          </span>
        </div>
      </div>

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0])}
        className={`w-full ${colorClass}`} // Pass color to slider track if customized
      />

      <div className="flex items-start gap-2 bg-black/20 p-2 rounded border border-white/5 text-xs text-zinc-400 font-mono">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-500" />
        <span>{previewText}</span>
      </div>
    </div>
  );
}
