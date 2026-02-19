"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GlowContainer } from "@/components/layout/GlowContainer";

interface NashBargainingVizProps {
  safetyUtility: number;
  returnUtility: number;
  disagreementPoint: { x: number; y: number };
}

export function NashBargainingViz({ safetyUtility, returnUtility, disagreementPoint }: NashBargainingVizProps) {
  const data = [
    { x: safetyUtility, y: returnUtility, name: "Equilibrium" },
  ];

  return (
    <GlowContainer glowColor="purple" intensity="medium" className="flex flex-col items-center p-6 h-full">
      <h3 className="font-orbitron text-lg text-white mb-4 tracking-wider">Nash Equilibrium</h3>
      
      <div className="w-full h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" dataKey="x" name="Safety Utility" domain={[0, 1]} stroke="#666" fontSize={10} />
            <YAxis type="number" dataKey="y" name="Return Utility" domain={[0, 1]} stroke="#666" fontSize={10} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }} />
            
            {/* Equilibrium Point */}
            <Scatter name="Negotiated Solution" data={data} fill="#aa00ff" shape="circle" />
            
            {/* Disagreement Point (Reference) */}
            <Scatter name="Status Quo" data={[disagreementPoint]} fill="#ff00ff" shape="cross" />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neon-purple" /> Solution
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-500" /> Disagreement
          </div>
        </div>
      </div>
      
      <p className="text-zinc-400 text-xs text-center mt-2 px-4">
        Optimizing tradeoff between safety (X) and return (Y).
      </p>
    </GlowContainer>
  );
}
